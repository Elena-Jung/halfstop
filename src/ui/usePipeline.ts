import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fontUrl } from '../assets/fontUrls';
import { toFields } from '../core/exif/map';
import { readExif, type PhotoMeta } from '../core/exif/read';
import { PREVIEW_LONG_EDGE, type ExportPreset } from '../core/export/resolution';
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
import { DEFAULT_FONT_ID, fontById } from '../core/paint/fontFamilies';
import { ensureCanvasFontOnce, type FontFaceSetLike } from '../core/paint/fonts';
import { createMeasurer } from '../core/paint/measure';
import { buildScene } from '../core/render/buildScene';
import { paintToCanvas } from '../core/render/paintToCanvas';
import type { MessageKey } from '../i18n';
import { cachedCanvasLimit } from '../platform/canvasLimitCache';
import { readSettings, writeSettings, type StoredSettings } from '../platform/settingsStore';
import { createRenderClient, type RenderClient } from '../worker/client';
import { toUserMessage } from './errorMessage';
import { applyToSelected, capItems, MAX_PHOTOS, previewIndex, toggleSelectAll } from './photos';

const NO_LOGO = () => null;

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

export interface Loaded {
  file: File;
  meta: PhotoMeta;
  fields: Partial<Record<TemplateToken, string>>;
  preview: DecodedImage;
  /** 이 사진을 디코딩한 조건입니다. 사진에 딸린 사실이므로 내보낼 때 다시 재지 않고 들고 있습니다. */
  autoOriented: boolean;
  /** 썸네일에 쓸 주소입니다. 목록에서 빠질 때 반드시 회수합니다. */
  thumbUrl: string;
  /** 설정이 사진마다 따로 붙습니다. 이것이 여러 장 지원의 핵심입니다. */
  presetId: string;
  values: Map<string, OptionValue>;
}

function closePhoto(photo: Loaded): void {
  photo.preview.bitmap.close();
  URL.revokeObjectURL(photo.thumbUrl);
}

/** 새로 불러온 사진의 시작 설정입니다. 저장된 마지막 설정이 없으면 기본 프리셋입니다. */
function initialPhotoSettings(stored: StoredSettings | null): {
  presetId: string;
  values: Map<string, OptionValue>;
} {
  const preset = presetById(stored?.presetId ?? DEFAULT_PRESET_ID);
  return { presetId: preset.id, values: valuesFor(preset, stored?.values ?? {}) };
}

export function usePipeline(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [status, setStatus] = useState<StatusMessage>({ key: 'status.preparing' });
  // 사진이 하나도 없을 때 잠긴 설정 패널에 보일 값입니다. 사진이 생기면 그 사진 자신의
  // 설정으로 넘어갑니다.
  const emptyStored = useMemo(() => readSettings(), []);
  const emptyPreset = useMemo(() => presetById(emptyStored?.presetId ?? DEFAULT_PRESET_ID), [emptyStored]);
  const emptyOptions = useMemo(
    () => valuesFor(emptyPreset, emptyStored?.values ?? {}),
    [emptyPreset, emptyStored],
  );

  const [loadedFonts, setLoadedFonts] = useState<ReadonlySet<string>>(() => new Set());
  const [photos, setPhotos] = useState<readonly Loaded[]>([]);
  const [selected, setSelected] = useState<ReadonlySet<number>>(() => new Set());
  const [busy, setBusy] = useState(false);
  // 저장 설정에는 담지 않습니다. 내보내기 크기는 그때그때 고르는 값이지 사진 프레임에
  // 딸린 값이 아닙니다.
  const [exportSize, setExportSize] = useState<ExportPreset>('original');
  // 캔버스 aria-label 이 사진 위에 실제로 적힌 글을 읽어 줄 수 있도록, 그린 장면의
  // 글자 노드를 그대로 모아 둡니다. 화면이 이 값을 그대로 보여 주지 않고 t() 로
  // 문장에 끼워 넣습니다.
  const [frameText, setFrameText] = useState('');

  const previewIdx = useMemo(() => previewIndex(selected), [selected]);
  const previewPhoto = previewIdx !== null ? (photos[previewIdx] ?? null) : null;

  const preset = useMemo(
    () => presetById(previewPhoto?.presetId ?? emptyPreset.id),
    [previewPhoto, emptyPreset],
  );
  const options = previewPhoto?.values ?? emptyOptions;
  const presetOptions = useMemo(() => optionsFor(preset), [preset]);

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
    servicesRef.current ??= { measureText: createMeasurer(), hasLogo: () => false };
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

  useEffect(() => {
    if (fontReady && photos.length === 0) setStatus({ key: 'status.readyToDrop' });
  }, [fontReady, photos.length]);

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
        logoId: undefined,
        layout: layoutFor(preset),
        options,
        services,
      });

      paintToCanvas({
        scene,
        canvas,
        photo: previewPhoto.preview.bitmap,
        logo: NO_LOGO,
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
  }, [canvasRef, previewPhoto, options, fontReady, preset]);

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
    const { kept, overflow } = capItems(files);
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
          autoOriented,
          thumbUrl: URL.createObjectURL(file),
          presetId: initial.presetId,
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

    setPhotos((previous) => {
      for (const photo of previous) closePhoto(photo);
      return decoded;
    });
    // 방금 불러온 첫 번째 사진만 고른 채로 시작합니다. 사진마다 다른 스타일을 주려면
    // 한 장씩 고르며 다듬는 편이 자연스럽고, 미리보기 대상 규칙(가장 앞선 인덱스)과도 맞습니다.
    setSelected(new Set([0]));

    setStatus(
      overflow > 0
        ? { key: 'status.tooMany', vars: { max: MAX_PHOTOS } }
        : { key: 'status.readyToDrop' },
    );
  }, []);

  const toggleSelected = useCallback((index: number) => {
    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelected((previous) => toggleSelectAll(photosRef.current.length, previous));
  }, []);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setPhotos((previous) =>
      applyToSelected(previous, selected, (photo) => ({
        ...photo,
        values: new Map(photo.values).set(id, value),
      })),
    );
  }, [selected]);

  // 프리셋을 바꾸면 값도 그 프리셋 기준으로 새로 만듭니다. 이전 프리셋에서 만진 값을
  // 그대로 들고 가면 레이아웃이 달라 뜻이 어긋납니다.
  const setPreset = useCallback((id: string) => {
    const next = presetById(id);
    setPhotos((previous) =>
      applyToSelected(previous, selected, (photo) => ({
        ...photo,
        presetId: next.id,
        values: valuesFor(next, {}),
      })),
    );
  }, [selected]);

  useEffect(() => {
    if (!previewPhoto) return;
    writeSettings({
      presetId: previewPhoto.presetId,
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
        logoId: undefined,
        layout: layoutFor(preset),
        options,
        services,
      });

      const result = await client.render({
        file: previewPhoto.file,
        scene,
        autoOriented: previewPhoto.autoOriented,
        orientation: previewPhoto.meta.orientation,
        limit,
        size: exportSize,
        format: 'image/jpeg',
        quality: 0.92,
        fontId,
      });

      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${previewPhoto.file.name.replace(/\.[^.]+$/, '')}-halfstop.jpg`;
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
  }, [previewPhoto, options, fontId, fontReady, preset, exportSize]);

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
    toggleSelected,
    toggleAll,
    hasPreview: previewPhoto !== null,
    exportTargetName: previewPhoto?.file.name ?? null,
    frameText,
    presetId: preset.id,
    setPreset,
    presetOptions,
    exportSize,
    setExportSize,
  };
}
