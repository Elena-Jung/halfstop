import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { fontUrl } from '../assets/fontUrls';
import { toFields } from '../core/exif/map';
import { readExif, type PhotoMeta } from '../core/exif/read';
import { PREVIEW_LONG_EDGE } from '../core/export/resolution';
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
import { cachedCanvasLimit } from '../platform/canvasLimitCache';
import { readSettings, writeSettings } from '../platform/settingsStore';
import { createRenderClient, type RenderClient } from '../worker/client';
import { toUserMessage } from './errorMessage';

const NO_LOGO = () => null;

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

interface Loaded {
  file: File;
  meta: PhotoMeta;
  fields: Partial<Record<TemplateToken, string>>;
  preview: DecodedImage;
}

export function usePipeline(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [status, setStatus] = useState('준비하는 중입니다');
  const stored = useMemo(() => readSettings(), []);
  const [presetId, setPresetId] = useState(
    () => presetById(stored?.presetId ?? DEFAULT_PRESET_ID).id,
  );
  const [options, setOptions] = useState<Map<string, OptionValue>>(() =>
    valuesFor(presetById(stored?.presetId ?? DEFAULT_PRESET_ID), stored?.values ?? {}),
  );

  const preset = useMemo(() => presetById(presetId), [presetId]);
  const presetOptions = useMemo(() => optionsFor(preset), [preset]);

  const [loadedFonts, setLoadedFonts] = useState<ReadonlySet<string>>(() => new Set());
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);

  const servicesRef = useRef<LayoutServices | null>(null);
  const limitRef = useRef<CanvasLimit | null>(null);
  const clientRef = useRef<RenderClient | null>(null);
  const frameRef = useRef<number | null>(null);
  // load() 를 연달아 부르면 늦게 시작한 쪽이 먼저 끝날 수 있습니다. 이 값으로 진 쪽을 가려냅니다.
  const loadGenerationRef = useRef(0);
  // 마운트 해제 때 마지막으로 성공한 미리보기 비트맵을 닫는 데 씁니다.
  const loadedRef = useRef<Loaded | null>(null);

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
      loadedRef.current?.preview.bitmap.close();
    };
  }, []);

  useEffect(() => {
    loadedRef.current = loaded;
  }, [loaded]);

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
        if (alive) setStatus(`${fontById(fontId).label} 서체를 불러오지 못했습니다`);
      });
    return () => {
      alive = false;
    };
  }, [fontId, loadedFonts]);

  useEffect(() => {
    if (fontReady && !loaded) setStatus('사진을 끌어다 놓거나 아래에서 선택하십시오');
  }, [fontReady, loaded]);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const services = servicesRef.current;
    if (!canvas || !loaded || !services || !fontReady) return;

    // requestAnimationFrame 콜백 안이라 여기서 던지면 아무도 잡지 않습니다. 값을
    // 바꿀 때마다 같은 예외가 조용히 반복되지 않도록 상태 문구로만 알립니다.
    try {
      const scene = buildScene({
        photoPx: { width: loaded.preview.width, height: loaded.preview.height },
        fields: loaded.fields,
        logoId: undefined,
        layout: layoutFor(preset),
        options,
        services,
      });

      paintToCanvas({
        scene,
        canvas,
        photo: loaded.preview.bitmap,
        logo: NO_LOGO,
        targetLongEdge: PREVIEW_LONG_EDGE,
        limit: PREVIEW_LIMIT,
      });
    } catch (error) {
      console.error(error);
      setStatus(toUserMessage(error, '미리보기를 그리지 못했습니다'));
    }
  }, [canvasRef, loaded, options, fontReady, preset]);

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
    const file = files[0];
    if (!file) return;

    // 이전 사진을 미리 지우지 않습니다. 이 시도가 실패해도 열어 둔 사진은 그대로
    // 남아야 합니다. 세대 번호로 늦게 끝난 요청이 먼저 끝난 요청을 덮어쓰는 것도
    // 막습니다.
    const generation = (loadGenerationRef.current += 1);
    setStatus('읽는 중입니다');

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
        return;
      }

      setLoaded((previous) => {
        previous?.preview.bitmap.close();
        return { file, meta, fields: toFields(meta), preview };
      });
      // 여러 장 처리는 아직 없습니다. 조용히 버리면 사용자는 왜 한 장만 나오는지
      // 알 수 없으므로 무엇을 불러왔고 무엇을 안 불러왔는지 밝힙니다.
      setStatus(
        files.length > 1
          ? `${file.name} 파일 하나만 불러왔습니다. 여러 장을 한 번에 처리하는 기능은 아직 없습니다`
          : `${file.name} 파일을 불러왔습니다`,
      );
    } catch (error) {
      console.error(error);
      // 이미 다음 요청이 시작됐으면 그 요청의 상태 문구를 덮어쓰지 않습니다.
      if (loadGenerationRef.current !== generation) return;
      setStatus(toUserMessage(error, '사진을 여는 데 실패했습니다'));
    }
  }, []);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setOptions((previous) => new Map(previous).set(id, value));
  }, []);

  // 프리셋을 바꾸면 값도 그 프리셋 기준으로 새로 만듭니다. 이전 프리셋에서 만진 값을
  // 그대로 들고 가면 레이아웃이 달라 뜻이 어긋납니다.
  const setPreset = useCallback((id: string) => {
    const next = presetById(id);
    setPresetId(next.id);
    setOptions(valuesFor(next, {}));
  }, []);

  useEffect(() => {
    writeSettings({ presetId, values: Object.fromEntries(options) });
  }, [presetId, options]);

  const download = useCallback(async () => {
    const services = servicesRef.current;
    const client = clientRef.current;
    if (!loaded || !services || !client || !fontReady) return;

    // 실제 캔버스 한계는 큰 할당을 여러 번 해 봐야 알 수 있어 느립니다. 미리보기에는
    // 필요 없으니 내보내기 직전인 여기서 처음 재고, 이후로는 캐시된 값을 씁니다.
    limitRef.current ??= cachedCanvasLimit();
    const limit = limitRef.current;

    setBusy(true);
    setStatus('전체 해상도로 그리는 중입니다');
    try {
      const scene = buildScene({
        photoPx: { width: loaded.preview.width, height: loaded.preview.height },
        fields: loaded.fields,
        logoId: undefined,
        layout: layoutFor(preset),
        options,
        services,
      });

      const result = await client.render({
        file: loaded.file,
        scene,
        autoOriented: await autoOrientedFlag(),
        orientation: loaded.meta.orientation,
        limit,
        preset: 'original',
        format: 'image/jpeg',
        quality: 0.92,
        fontId,
      });

      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${loaded.file.name.replace(/\.[^.]+$/, '')}-halfstop.jpg`;
      anchor.click();
      // 클릭 직후에 회수하면 브라우저가 blob을 다 읽기 전에 주소가 사라져 파일이
      // 잘릴 수 있습니다. 이 앱이 내보내는 것은 수십 메가바이트짜리 사진입니다.
      window.setTimeout(() => URL.revokeObjectURL(url), 10_000);

      setStatus(
        result.clamped
          ? `내려받았습니다. 기기 한계 때문에 ${result.width}x${result.height}로 줄였습니다`
          : `내려받았습니다. ${result.width}x${result.height}`,
      );
    } catch (error) {
      console.error(error);
      setStatus(toUserMessage(error, '내보내기에 실패했습니다'));
    } finally {
      setBusy(false);
    }
  }, [loaded, options, fontId, fontReady, preset]);

  return {
    status,
    options,
    setOption,
    load,
    download,
    busy,
    ready: fontReady,
    hasPhoto: loaded !== null,
    presetId,
    setPreset,
    presetOptions,
  };
}
