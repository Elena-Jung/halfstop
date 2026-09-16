import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fontUrl } from '../assets/fontUrls';
import { toFields } from '../core/exif/map';
import { readExif, type PhotoMeta } from '../core/exif/read';
import {
  DEFAULT_EXPORT_FORMAT,
  EXPORT_FORMAT_IDS,
  EXPORT_FORMATS,
  type ExportFormatId,
} from '../core/export/formats';
import { PREVIEW_LONG_EDGE, type ExportPreset } from '../core/export/resolution';
import { canvasSupportsWebp } from '../core/export/webpSupport';
import {
  arrangementById,
  arrangementForLayout,
  arrangementValuesFor,
} from '../core/layout/arrangements';
import { detectAutoOrientation } from '../core/io/autoOrientProbe';
import { decodeImage, type DecodedImage } from '../core/io/decode';
import { swapsAxes } from '../core/io/orientation';
import {
  DEFAULT_PRESET_ID,
  layoutFor,
  optionsFor,
  presetById,
  valuesFor,
} from '../core/layout/presets';
import type { LayoutServices, OptionValue, TemplateToken } from '../core/layout/types';
import type { CanvasLimit } from '../core/limits/clampExportSize';
import { brandId } from '../core/logos/brandId';
import { hasLogo } from '../core/logos/registry';
import { DEFAULT_FONT_ID, fontById } from '../core/paint/fontFamilies';
import { ensureCanvasFontOnce, type FontFaceSetLike } from '../core/paint/fonts';
import { createMeasurer } from '../core/paint/measure';
import { buildScene } from '../core/render/buildScene';
import { pxPerUnitFor, type UnitMode } from './unitScale';
import { paintToCanvas } from '../core/render/paintToCanvas';
import { ensureSceneLogos, logoImage } from '../images/logoImages';
import type { MessageKey } from '../i18n';
import { cachedCanvasLimit } from '../platform/canvasLimitCache';
import { readSettings, writeSettings, type StoredSettings } from '../platform/settingsStore';
import { createRenderClient, type RenderClient } from '../worker/client';
import { toUserMessage } from './errorMessage';
import {
  applyToSelected,
  capItems,
  MAX_PHOTOS,
  previewIndex,
  reindexActive,
  reindexSelection,
  removeAt,
  toggleSelectAll,
} from './photos';

/** 화면이 t() 로 옮길 상태 문구입니다. 훅은 키와 값만 들고, 문자열은 만들지 않습니다. */
export interface StatusMessage {
  key: MessageKey;
  vars?: Record<string, string | number>;
}

/**
 * 미리보기는 긴 변 1600 이라 어떤 기기에서도 한계에 걸리지 않습니다. 실제 측정은
 * 큰 캔버스를 할당해 보는 일이라 내보내기 직전으로 미룹니다.
 */
const PREVIEW_LIMIT: CanvasLimit = { maxSide: 4096, maxArea: 4096 * 4096 };

/**
 * 탐지용 원본은 반드시 정사각형이 아니어야 합니다. 가로세로가 같으면 회전이
 * 일어났는지 관측할 방법이 없어 탐지가 늘 거짓을 돌려줍니다.
 * 바이트를 하드코딩하는 대신 캔버스로 만들어 실제로 유효한 JPEG임을 보장합니다.
 */
async function makeProbeJpeg(): Promise<Uint8Array> {
  const canvas = new OffscreenCanvas(3, 2);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('탐지용 2D 컨텍스트를 만들지 못했습니다');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 3, 2);
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.9 });
  return new Uint8Array(await blob.arrayBuffer());
}

/** 세션당 한 번이면 충분합니다. 결과 프라미스를 재사용합니다. */
let autoOrientedOnce: Promise<boolean> | null = null;
function autoOrientedFlag(): Promise<boolean> {
  if (!autoOrientedOnce) {
    autoOrientedOnce = makeProbeJpeg().then((base) =>
      detectAutoOrientation(async (blob) => createImageBitmap(blob), base),
    );
    // 거부된 프라미스를 남겨 두면 한 번의 오류가 세션 내내 사진 열기를 막습니다.
    // 지워서 다음 시도가 다시 재도록 합니다.
    void autoOrientedOnce.catch(() => {
      autoOrientedOnce = null;
    });
  }
  return autoOrientedOnce;
}

/**
 * WebP 를 만들 수 있는지는 실제로 한 장 만들어 봐야 알 수 있고 그 확인이 비동기입니다.
 * 세션 동안 달라지지 않는 사실이라 한 번만 재고 프라미스를 재사용합니다. 저장하지는
 * 않습니다. 재는 데 1x1 캔버스 한 장이면 되어 캐시할 값어치가 없습니다.
 */
let webpSupportOnce: Promise<boolean> | null = null;
function webpSupportedFlag(): Promise<boolean> {
  webpSupportOnce ??= canvasSupportsWebp();
  return webpSupportOnce;
}

export interface Loaded {
  file: File;
  meta: PhotoMeta;
  fields: Partial<Record<TemplateToken, string>>;
  preview: DecodedImage;
  /**
   * EXIF 가 적어 둔 원본 픽셀 크기입니다. 회전이 적용된 뒤의 축 기준입니다. 숫자 칸을
   * px 로 보일 때 1u 가 몇 픽셀인지 셈하는 데 씁니다. EXIF 에 크기가 없는 파일에서는
   * undefined 이고, 그때는 px 단추 자체를 내보내지 않습니다.
   */
  sourcePx: { width: number; height: number } | undefined;
  /** 이 사진을 디코딩한 조건입니다. 사진에 딸린 사실이므로 내보낼 때 다시 재지 않고 들고 있습니다. */
  autoOriented: boolean;
  /** 썸네일에 쓸 주소입니다. 목록에서 빠질 때 반드시 회수합니다. */
  thumbUrl: string;
  /** 설정이 사진마다 따로 붙습니다. 이것이 여러 장 지원의 핵심입니다. */
  presetId: string;
  /**
   * 지금 어느 배치 카드가 골라져 있는지 보이기 위한 값입니다. 값을 계산하는 겹이
   * 아닙니다. 실제 여덟 값은 배치를 고르는 순간 values 에 바로 써 넣습니다.
   */
  arrangementId: string;
  values: Map<string, OptionValue>;
}

function closePhoto(photo: Loaded): void {
  photo.preview.bitmap.close();
  URL.revokeObjectURL(photo.thumbUrl);
}

/** 새로 불러온 사진의 시작 설정입니다. 저장된 마지막 설정이 없으면 기본 프레임입니다. */
function initialPhotoSettings(stored: StoredSettings | null): {
  presetId: string;
  arrangementId: string;
  values: Map<string, OptionValue>;
} {
  const preset = presetById(stored?.presetId ?? DEFAULT_PRESET_ID);
  // 저장된 배치 id 가 목록에 없거나 이 프레임의 레이아웃에서 못 쓰는 것이면 그 레이아웃의
  // 기본 배치로 떨어집니다. 옛 저장값에는 이 필드가 아예 없어 항상 이 자리를 거칩니다.
  const arrangement = arrangementForLayout(stored?.arrangementId, preset.layout);
  return {
    presetId: preset.id,
    arrangementId: arrangement.id,
    values: valuesFor(preset, stored?.values ?? {}, arrangement.id),
  };
}

export function usePipeline(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  // null 은 할 말이 없다는 뜻입니다. 상태 줄 요소는 그대로 남고 내용만 빕니다.
  const [status, setStatus] = useState<StatusMessage | null>({ key: 'status.preparing' });
  // 사진이 하나도 없을 때 잠긴 설정 패널에 보일 값입니다. 사진이 생기면 그 사진 자신의
  // 설정으로 넘어갑니다.
  const emptyStored = useMemo(() => readSettings(), []);
  const emptyPreset = useMemo(() => presetById(emptyStored?.presetId ?? DEFAULT_PRESET_ID), [emptyStored]);
  const emptyArrangement = useMemo(
    () => arrangementForLayout(emptyStored?.arrangementId, emptyPreset.layout),
    [emptyPreset, emptyStored],
  );
  const emptyOptions = useMemo(
    () => valuesFor(emptyPreset, emptyStored?.values ?? {}, emptyArrangement.id),
    [emptyPreset, emptyStored, emptyArrangement],
  );

  const [loadedFonts, setLoadedFonts] = useState<ReadonlySet<string>>(() => new Set());
  // 로고 그림은 받아 와야 그릴 수 있는데 paintToCanvas 는 동기 함수입니다. 받아 온 뒤 이
  // 값을 올려 다시 그립니다. 서체를 기다리는 fontReady 와 같은 자리이지만, 로고는 없으면
  // 그 노드만 비고 나머지는 멀쩡히 그려지므로 기다리지 않고 먼저 그린 뒤 채웁니다.
  const [logoVersion, setLogoVersion] = useState(0);
  const [photos, setPhotos] = useState<readonly Loaded[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  // 마지막에 누른 썸네일입니다. 미리보기 대상을 이것으로 정하면 썸네일을 누를 때마다
  // 예외 없이 그 사진이 뜹니다. 고른 것 안에 없으면(방금 선택을 푼 경우) previewIndex 가
  // 가장 앞선 것으로 떨어뜨리므로 화면이 비지 않습니다.
  const [active, setActive] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  // 미리보기를 그릴 때마다 그 장면의 크기를 적어 둡니다. 숫자 칸을 px 로 보일 때 1u 가
  // 몇 픽셀인지 셈하려면 장면의 긴 변이 필요한데, 장면은 rAF 콜백 안에서 만들어집니다.
  // 여기서 따로 한 번 더 만들면 글자 폭을 재느라 값이 바뀔 때마다 배치가 두 번 돕니다.
  const [sceneSize, setSceneSize] = useState<{ width: number; height: number } | null>(null);
  // 저장 설정에는 담지 않습니다. 내보내기 크기는 그때그때 고르는 값이지 사진 프레임에
  // 딸린 값이 아닙니다.
  const [exportSize, setExportSize] = useState<ExportPreset>('original');
  // 형식도 크기와 같은 자리입니다. 프레임의 모양이 아니라 내려받는 순간의 선택입니다.
  const [exportFormat, setExportFormat] = useState<ExportFormatId>(DEFAULT_EXPORT_FORMAT);
  // 재는 동안에는 거짓입니다. 고를 수 있게 두었다가 누른 뒤에 실패하는 것보다, 못 만드는
  // 형식은 아예 목록에 없는 편이 낫습니다.
  const [webpSupported, setWebpSupported] = useState(false);
  // 캔버스 aria-label 이 사진 위에 실제로 적힌 글을 읽어 줄 수 있도록, 그린 장면의
  // 글자 노드를 그대로 모아 둡니다. 화면이 이 값을 그대로 보여 주지 않고 t() 로
  // 문장에 끼워 넣습니다.
  const [frameText, setFrameText] = useState('');

  // 숫자 칸이 값을 보여 주고 받는 단위입니다. 칸마다 따로 두지 않습니다. 한 칸은 u,
  // 옆 칸은 px 인 화면은 읽을 수 없습니다. 저장하지 않으므로 새로 열면 u 입니다.
  const [unitMode, setUnitMode] = useState<UnitMode>('u');

  /**
   * 로고로 쓸 브랜드 id 입니다. LOGO_SOURCE 가 바디와 렌즈 중 어느 쪽 제조사를 볼지
   * 정합니다. 레이아웃도 같은 값을 보고 워드마크에 쓸 이름을 고르므로, 두 곳이 같은
   * 규칙을 따라야 로고와 이름이 어긋나지 않습니다.
   */
  const logoIdFor = (
    fields: Partial<Record<TemplateToken, string>>,
    values: ReadonlyMap<string, OptionValue>,
  ): string | undefined => {
    const source = values.get('LOGO_SOURCE');
    if (source === 'none') return undefined;
    return brandId(source === 'lens' ? fields.LENS_MAKER : fields.MAKER);
  };

  const previewIdx = useMemo(() => previewIndex(selected, active), [selected, active]);
  const previewPhoto = previewIdx !== null ? (photos[previewIdx] ?? null) : null;

  /**
   * 1u 가 내보낼 파일에서 몇 픽셀이 되는지입니다. 사진의 원본 크기를 모르면 null 이고
   * 화면은 그때 px 단추를 내보내지 않습니다.
   */
  const pxPerUnit = useMemo(
    () => pxPerUnitFor(exportSize, sceneSize, previewPhoto?.sourcePx),
    [exportSize, sceneSize, previewPhoto],
  );

  const preset = useMemo(
    () => presetById(previewPhoto?.presetId ?? emptyPreset.id),
    [previewPhoto, emptyPreset],
  );
  const options = previewPhoto?.values ?? emptyOptions;
  const presetOptions = useMemo(() => optionsFor(preset), [preset]);
  const arrangementId = previewPhoto?.arrangementId ?? emptyArrangement.id;

  const servicesRef = useRef<LayoutServices | null>(null);
  const limitRef = useRef<CanvasLimit | null>(null);
  const clientRef = useRef<RenderClient | null>(null);
  const frameRef = useRef<number | null>(null);
  // load() 를 연달아 부르면 늦게 시작한 쪽이 먼저 끝날 수 있습니다. 이 값으로 진 쪽을 가려냅니다.
  const loadGenerationRef = useRef(0);
  // 마운트 해제 때 마지막으로 성공한 사진 목록의 비트맵과 썸네일 주소를 회수하는 데 씁니다.
  const photosRef = useRef<readonly Loaded[]>([]);

  const fontId = useMemo(() => {
    const value = options.get('FONT_FAMILY');
    return typeof value === 'string' ? value : DEFAULT_FONT_ID;
  }, [options]);
  const fontReady = loadedFonts.has(fontId);

  useEffect(() => {
    clientRef.current ??= createRenderClient();
    servicesRef.current ??= { measureText: createMeasurer(), hasLogo };
    void autoOrientedFlag().catch(() => undefined);
    return () => {
      clientRef.current?.dispose();
      clientRef.current = null;
      for (const photo of photosRef.current) closePhoto(photo);
    };
  }, []);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  // 확인이 끝나면 형식 목록이 한 칸 늘어납니다. canvasSupportsWebp 는 스스로 실패를
  // 삼키고 거짓을 돌려주므로 여기에 따로 잡을 것이 없습니다.
  useEffect(() => {
    let alive = true;
    void webpSupportedFlag().then((supported) => {
      if (alive) setWebpSupported(supported);
    });
    return () => {
      alive = false;
    };
  }, []);

  const exportFormats = useMemo(
    () => EXPORT_FORMAT_IDS.filter((id) => id !== 'webp' || webpSupported),
    [webpSupported],
  );

  // 고른 서체가 준비되기 전에 measureText를 부르면 대체 서체 폭으로 배치가 계산됩니다.
  useEffect(() => {
    if (loadedFonts.has(fontId)) return;
    let alive = true;
    void ensureCanvasFontOnce(document.fonts as unknown as FontFaceSetLike, fontById(fontId), fontUrl(fontId))
      .then(() => {
        if (!alive) return;
        setLoadedFonts((previous) => new Set(previous).add(fontId));
      })
      .catch(() => {
        if (alive) setStatus({ key: 'status.fontFailed', vars: { font: fontById(fontId).label } });
      });
    return () => {
      alive = false;
    };
  }, [fontId, loadedFonts]);

  // 서체가 준비되면 "준비하는 중입니다" 를 걷어 상태 줄을 비웁니다. 예전에는 이 자리에서
  // 사진을 넣으라는 안내를 띄웠는데, 점선 상자 안에 이미 같은 말이 있고 그 옆에 추가
  // 단추도 있어 같은 말이 세 번이었습니다. 사용자가 그것을 지적했습니다.
  //
  // photos.length 를 의존성에 두지 않습니다. 두면 전체 삭제로 장수가 0 으로 떨어질 때도
  // 다시 돌아, 방금 몇 장을 뺐는지 알리는 status.removed 문구를 곧바로 덮어씁니다.
  // photosRef 는 위 동기화 effect 가 같은 커밋에서 먼저 갱신해 두므로 여기서 최신 값을
  // 그대로 읽을 수 있습니다.
  useEffect(() => {
    if (fontReady && photosRef.current.length === 0) setStatus(null);
  }, [fontReady]);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const services = servicesRef.current;
    if (!canvas || !services || !fontReady) return;

    if (!previewPhoto) {
      // 아무것도 안 골랐거나 사진이 없습니다. 이전에 그려 둔 것이 남아 있지 않도록 비웁니다.
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
      setFrameText('');
      return;
    }

    // requestAnimationFrame 콜백 안이라 여기서 던지면 아무도 잡지 않습니다. 값을
    // 바꿀 때마다 같은 예외가 조용히 반복되지 않도록 상태 문구로만 알립니다.
    try {
      const scene = buildScene({
        photoPx: { width: previewPhoto.preview.width, height: previewPhoto.preview.height },
        fields: previewPhoto.fields,
        logoId: logoIdFor(previewPhoto.fields, options),
        layout: layoutFor(preset),
        options,
        services,
      });
      setSceneSize({ width: scene.width, height: scene.height });

      // 워커도 내보내기 직전에 같은 함수를 부릅니다. 한쪽만 챙기면 미리보기와 받은
      // 파일이 갈라집니다. 이미 캐시에 있으면 false 라 다시 그리지 않습니다.
      void ensureSceneLogos(scene)
        .then((added) => {
          if (added) setLogoVersion((version) => version + 1);
        })
        .catch(() => undefined);

      paintToCanvas({
        scene,
        canvas,
        photo: previewPhoto.preview.bitmap,
        logo: logoImage,
        targetLongEdge: PREVIEW_LONG_EDGE,
        limit: PREVIEW_LIMIT,
      });

      setFrameText(
        scene.nodes
          .filter((node) => node.kind === 'text')
          .map((node) => node.text)
          .join(', '),
      );
    } catch (error) {
      console.error(error);
      setStatus({ key: toUserMessage(error) });
    }
  }, [canvasRef, previewPhoto, options, fontReady, preset, logoVersion]);

  // 옵션이 연달아 바뀌어도 프레임마다 한 번만 그립니다.
  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      repaint();
    });
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [repaint]);

  const load = useCallback(async (files: readonly File[]) => {
    // 이미 불러온 사진에 더합니다. 갈아치우지 않습니다. 상한은 전체 장수 기준이므로 남은
    // 자리만큼만 받습니다.
    const room = Math.max(0, MAX_PHOTOS - photosRef.current.length);
    if (room === 0) {
      setStatus({ key: 'status.full', vars: { max: MAX_PHOTOS } });
      return;
    }
    const { kept, overflow } = capItems(files, room);
    if (kept.length === 0) return;

    // 이전 사진을 미리 지우지 않습니다. 이 시도가 실패해도 열어 둔 사진은 그대로
    // 남아야 합니다. 세대 번호로 늦게 끝난 요청이 먼저 끝난 요청을 덮어쓰는 것도
    // 막습니다.
    const generation = (loadGenerationRef.current += 1);
    setStatus({ key: 'status.reading' });

    const initial = initialPhotoSettings(readSettings());
    const decoded: Loaded[] = [];
    let lastError: unknown = null;

    // 한꺼번에 디코딩하면 메모리가 한 번에 치솟으므로 한 장씩 순서대로 처리합니다.
    for (const file of kept) {
      if (loadGenerationRef.current !== generation) break;

      try {
        const meta = await readExif(await file.arrayBuffer());
        const autoOriented = await autoOrientedFlag();

        // resizeWidth 와 resizeHeight 는 회전이 적용된 뒤의 축에 걸립니다. EXIF 에 적힌
        // 크기는 회전 전 기준이므로, 브라우저가 이미 회전을 적용했을 때 뒤집어야 합니다.
        const swap = autoOriented && swapsAxes(meta.orientation);
        const sourceSize =
          meta.pixelWidth !== undefined && meta.pixelHeight !== undefined
            ? swap
              ? { width: meta.pixelHeight, height: meta.pixelWidth }
              : { width: meta.pixelWidth, height: meta.pixelHeight }
            : undefined;

        const preview = await decodeImage({
          file,
          autoOriented,
          orientation: meta.orientation,
          maxLongEdge: PREVIEW_LONG_EDGE,
          ...(sourceSize ? { sourceSize } : {}),
        });

        if (loadGenerationRef.current !== generation) {
          // 기다리는 동안 다음 요청이 이미 시작됐습니다. 이 결과는 버립니다.
          preview.bitmap.close();
          break;
        }

        decoded.push({
          file,
          meta,
          fields: toFields(meta),
          preview,
          sourcePx: sourceSize,
          autoOriented,
          thumbUrl: URL.createObjectURL(file),
          presetId: initial.presetId,
          arrangementId: initial.arrangementId,
          values: new Map(initial.values),
        });
      } catch (error) {
        console.error(error);
        lastError = error;
        // 한 장이 실패해도 나머지는 계속 시도합니다.
      }
    }

    if (loadGenerationRef.current !== generation) {
      // 이 배치 전체가 늦었습니다. 지금까지 만든 것을 전부 반납합니다.
      for (const photo of decoded) closePhoto(photo);
      return;
    }

    if (decoded.length === 0) {
      setStatus({ key: lastError ? toUserMessage(lastError) : 'error.decode' });
      return;
    }

    // 이전 사진을 닫지 않고 뒤에 붙입니다. 이미 골라 스타일을 준 사진이 사라지면 안 됩니다.
    //
    // 붙는 자리를 ref 로 읽어도 되는 이유는 위의 세대 검사 때문입니다. 다음 요청이 시작되면
    // 세대가 올라가 먼저 시작한 쪽이 여기 닿지 못하므로, 한 세대에 한 배치만 목록에
    // 반영됩니다. 그래서 이 시점의 ref 가 곧 반영 직전의 목록입니다.
    const addedFrom = photosRef.current.length;
    setPhotos((previous) => [...previous, ...decoded]);
    // 방금 더한 사진들만 고른 채로 둡니다. 이어서 그 사진들을 다듬는 것이 자연스러운 흐름입니다.
    // 미리보기는 그중 첫 장으로 갑니다. 더하기 전에 보던 사진에 그대로 머무르면 방금 넣은
    // 사진이 어떻게 나왔는지 확인할 수 없습니다.
    setSelected(new Set(decoded.map((_, offset) => addedFrom + offset)));
    setActive(addedFrom);

    // 다 불러왔으면 상태 줄을 비웁니다. 장수는 옆에 따로 나오므로 여기서 할 말이 없고,
    // 예전에는 사진을 넣으라는 안내를 그대로 두어 사진이 가득한 화면에도 그 말이 남아
    // 있었습니다.
    setStatus(overflow > 0 ? { key: 'status.tooMany', vars: { max: MAX_PHOTOS } } : null);
  }, []);

  /**
   * 누른 썸네일을 활성으로 올립니다. 선택을 켜는 경우든 끄는 경우든 똑같이 올립니다.
   * 켜는 경우에는 그 사진이 곧 미리보기가 되고, 끄는 경우에는 활성 인덱스가 고른 것
   * 밖으로 나가 previewIndex 가 남은 고른 것 중 가장 앞선 것으로 떨어뜨립니다. 다시
   * 켜면 활성이 이미 이 인덱스라 그 사진으로 돌아옵니다.
   */
  const toggleSelected = useCallback((index: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
    setActive(index);
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((previous) => toggleSelectAll(photosRef.current.length, previous));
  }, []);

  /**
   * 고른 사진만 화면에서 뺍니다. 파일을 지우는 것이 아니라 목록에서만 빼는 것이라
   * 확인 창을 두지 않고, 대신 몇 장을 뺐는지 상태 문구로 알립니다.
   */
  const removeSelected = useCallback(() => {
    if (selected.size === 0) return;
    const current = photosRef.current;
    const { kept, removed } = removeAt(current, selected);
    for (const photo of removed) closePhoto(photo);
    setPhotos(kept);
    setSelected(reindexSelection(selected, selected, current.length));
    // 선택 집합만 다시 세고 활성 인덱스를 그대로 두면 삭제 뒤에 엉뚱한 사진이 뜹니다.
    setActive(reindexActive(active, selected, current.length));
    setStatus({ key: 'status.removed', vars: { count: removed.length } });
  }, [selected, active]);

  /** 불러온 사진을 전부 뺍니다. 사진이 없으면 아무 일도 하지 않습니다. */
  const removeAll = useCallback(() => {
    const current = photosRef.current;
    if (current.length === 0) return;
    for (const photo of current) closePhoto(photo);
    setPhotos([]);
    setSelected(new Set());
    setActive(null);
    setStatus({ key: 'status.removed', vars: { count: current.length } });
  }, []);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setPhotos((previous) =>
      applyToSelected(previous, selected, (photo) => ({
        ...photo,
        values: new Map(photo.values).set(id, value),
      })),
    );
  }, [selected]);

  // 프레임을 바꾸면 프레임 값은 그 프리셋 기준으로 새로 만듭니다. 이전 프레임에서 만진
  // 값을 그대로 들고 가면 레이아웃이 달라 뜻이 어긋납니다.
  //
  // 배치는 따라오지 않습니다. 프레임을 고르는 것이 배치까지 바꾸면 두 칸의 역할이 다시
  // 섞입니다. 다만 지금 배치를 새 레이아웃에서 쓸 수 없으면(예: 꼬리 줄을 쓰는 bar 전용
  // 배치에서 여백 액자 프레임으로) 그 레이아웃의 기본 배치로 떨어집니다.
  const setPreset = useCallback((id: string) => {
    const next = presetById(id);
    setPhotos((previous) =>
      applyToSelected(previous, selected, (photo) => {
        const arrangement = arrangementForLayout(photo.arrangementId, next.layout);
        return {
          ...photo,
          presetId: next.id,
          arrangementId: arrangement.id,
          values: valuesFor(next, {}, arrangement.id),
        };
      }),
    );
  }, [selected]);

  /**
   * 배치는 고르는 순간 그 여덟 값을 사진의 values 에 바로 써 넣습니다. valuesFor 의
   * 세 겹(선언 기본값 -> 프리셋이 덮는 값 -> 저장된 값)을 다시 태우면 저장된 옛 값이
   * 새 배치를 다시 덮어써 아무 일도 안 일어난 것처럼 보입니다. 값 계산 겹을 건드리지
   * 않고 여기서 직접 쓰면, 사용자가 템플릿을 손으로 고친 것도 다음 배치 변경 전까지
   * 살아남습니다.
   */
  const setArrangement = useCallback(
    (id: string) => {
      const arrangement = arrangementById(id);
      const values = arrangementValuesFor(arrangement, preset.layout);
      setPhotos((previous) =>
        applyToSelected(previous, selected, (photo) => {
          const nextValues = new Map(photo.values);
          for (const [key, value] of Object.entries(values)) {
            nextValues.set(key, value);
          }
          return { ...photo, arrangementId: arrangement.id, values: nextValues };
        }),
      );
    },
    [selected, preset.layout],
  );

  useEffect(() => {
    if (!previewPhoto) return;
    writeSettings({
      presetId: previewPhoto.presetId,
      arrangementId: previewPhoto.arrangementId,
      values: Object.fromEntries(previewPhoto.values),
    });
  }, [previewPhoto]);

  const download = useCallback(async () => {
    const services = servicesRef.current;
    const client = clientRef.current;
    if (!previewPhoto || !services || !client || !fontReady) return;

    setBusy(true);
    setStatus({ key: 'status.rendering' });
    try {
      // 실제 캔버스 한계는 큰 할당을 여러 번 해 봐야 알 수 있어 느립니다. 미리보기에는
      // 필요 없으니 내보내기 직전인 여기서 처음 재고, 이후로는 캐시된 값을 씁니다.
      // busy 표시보다 먼저 재면 화면이 반응 없이 멈춘 것처럼 보이므로 반드시 뒤에 둡니다.
      limitRef.current ??= cachedCanvasLimit();
      const limit = limitRef.current;

      const scene = buildScene({
        photoPx: { width: previewPhoto.preview.width, height: previewPhoto.preview.height },
        fields: previewPhoto.fields,
        logoId: logoIdFor(previewPhoto.fields, options),
        layout: layoutFor(preset),
        options,
        services,
      });

      const format = EXPORT_FORMATS[exportFormat];
      const result = await client.render({
        file: previewPhoto.file,
        scene,
        autoOriented: previewPhoto.autoOriented,
        orientation: previewPhoto.meta.orientation,
        limit,
        size: exportSize,
        format: format.mime,
        quality: format.quality,
        fontId,
      });

      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${previewPhoto.file.name.replace(/\.[^.]+$/, '')}-halfstop${format.extension}`;
      anchor.click();
      // 클릭 직후에 회수하면 브라우저가 blob을 다 읽기 전에 주소가 사라져 파일이
      // 잘릴 수 있습니다. 이 앱이 내보내는 것은 수십 메가바이트짜리 사진입니다.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);

      setStatus(
        result.clamped
          ? { key: 'status.downloadedClamped', vars: { width: result.width, height: result.height } }
          : { key: 'status.downloaded', vars: { width: result.width, height: result.height } },
      );
    } catch (error) {
      console.error(error);
      setStatus({ key: toUserMessage(error) });
    } finally {
      setBusy(false);
    }
  }, [previewPhoto, options, fontId, fontReady, preset, exportSize, exportFormat]);

  return {
    status,
    options,
    setOption,
    load,
    download,
    busy,
    ready: fontReady,
    photos,
    selected,
    // 지금 화면에 떠 있는 사진입니다. active 를 그대로 내보내면 선택이 풀려 떨어진
    // 경우에 표시와 화면이 어긋나므로, 떨어진 결과인 previewIdx 를 내보냅니다.
    activeIndex: previewIdx,
    toggleSelected,
    toggleAll,
    removeSelected,
    removeAll,
    hasPreview: previewPhoto !== null,
    exportTargetName: previewPhoto?.file.name ?? null,
    unitMode,
    setUnitMode,
    pxPerUnit,
    frameText,
    presetId: preset.id,
    setPreset,
    presetOptions,
    layout: preset.layout,
    arrangementId,
    setArrangement,
    exportSize,
    setExportSize,
    exportFormat,
    setExportFormat,
    exportFormats,
  };
}
