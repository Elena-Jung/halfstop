import { useLayoutEffect, useState } from 'react';
import { fontUrl } from '../assets/fontUrls';
import type { CanvasLimit } from '../core/limits/clampExportSize';
import { layoutFor, valuesFor, type Preset } from '../core/layout/presets';
import type { LayoutServices, OptionValue, TemplateToken } from '../core/layout/types';
import { fontById } from '../core/paint/fontFamilies';
import { ensureCanvasFontOnce, type FontFaceSetLike } from '../core/paint/fonts';
import { createMeasurer } from '../core/paint/measure';
import { buildScene } from '../core/render/buildScene';
import { paintToCanvas } from '../core/render/paintToCanvas';

export interface PresetThumbnail {
  src: string;
  width: number;
  height: number;
}

/**
 * 카드에 그릴 고정 예시 촬영 정보입니다. 사용자 사진이 아니라 늘 같은 값을 씁니다.
 * 실제 값처럼 보이면 충분하고, 어느 카메라의 실제 값인지는 뜻이 없습니다.
 */
const SAMPLE_FIELDS: Partial<Record<TemplateToken, string>> = {
  MAKER: 'Fujifilm',
  BODY: 'X100V',
  LENS: '23mm F2',
  LENS_MAKER: 'Fujifilm',
  MM: '35mm',
  F: 'f/2.8',
  SEC: '1/250s',
  ISO: 'ISO 200',
  TAKEN_AT: '2024-06-21',
};

/** 예시 사진의 픽셀 크기입니다. 카드에 작게 그려지므로 크게 둘 필요가 없습니다. */
const SAMPLE_PHOTO_PX = { width: 900, height: 600 };

const THUMBNAIL_LIMIT: CanvasLimit = { maxSide: 1024, maxArea: 1024 * 1024 };

/**
 * 카드 이미지 영역이 실제로 대략 119px 폭으로 놓입니다(설정 칸 안쪽 247px 을 8px
 * 간격으로 2열 나눈 값). 레티나 화면에서도 흐리지 않도록 두 배로 그립니다.
 */
const THUMBNAIL_LONG_EDGE = 238;

const services: LayoutServices = {
  measureText: createMeasurer(),
  // 카드 예시는 SHOW_LOGO 를 켜지 않는 프레임 값만 쓰므로 실제로는 불리지 않습니다.
  // 그래도 로고 레지스트리를 참조하지 않는 편이, 지금 로고 경로를 다시 짜고 있는
  // 다른 작업과 부딪히지 않아 안전합니다.
  hasLogo: () => false,
};

/**
 * 하늘에서 땅으로 가는 세로 그러데이션에 능선 하나입니다. 프레임 모양을 보여 주는
 * 것이 목적이라 이 정도로 충분합니다. 파일로 두지 않고 캔버스에 직접 그려 자산을
 * 늘리지 않고, 받아 올 것이 없어 실패할 일도 없습니다.
 */
function makeSamplePhoto(): HTMLCanvasElement {
  const { width, height } = SAMPLE_PHOTO_PX;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('예시 사진용 2D 컨텍스트를 만들지 못했습니다');

  const horizon = height * 0.62;
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, '#6fa3d6');
  sky.addColorStop(1, '#dce9f2');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, width, horizon);

  const ground = ctx.createLinearGradient(0, horizon, 0, height);
  ground.addColorStop(0, '#7c9a5c');
  ground.addColorStop(1, '#48602f');
  ctx.fillStyle = ground;
  ctx.beginPath();
  ctx.moveTo(0, horizon);
  ctx.lineTo(width * 0.32, horizon - height * 0.05);
  ctx.lineTo(width * 0.68, horizon + height * 0.02);
  ctx.lineTo(width, horizon - height * 0.02);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  return canvas;
}

function fontIdOf(values: ReadonlyMap<string, OptionValue>): string {
  const value = values.get('FONT_FAMILY');
  return typeof value === 'string' ? value : 'inter';
}

function renderThumbnail(
  preset: Preset,
  values: ReadonlyMap<string, OptionValue>,
  photo: HTMLCanvasElement,
): PresetThumbnail {
  const scene = buildScene({
    photoPx: SAMPLE_PHOTO_PX,
    fields: SAMPLE_FIELDS,
    logoId: undefined,
    layout: layoutFor(preset),
    options: values,
    services,
  });

  const canvas = document.createElement('canvas');
  paintToCanvas({
    scene,
    canvas,
    photo,
    logo: () => null,
    targetLongEdge: THUMBNAIL_LONG_EDGE,
    limit: THUMBNAIL_LIMIT,
  });
  return { src: canvas.toDataURL('image/png'), width: canvas.width, height: canvas.height };
}

/**
 * 프리셋마다 값을 한 번만 계산해 그림과 서체 id 양쪽에 씁니다. 두 번 계산하지
 * 않는 것이 목적입니다.
 */
function valuesByPreset(
  presets: readonly Preset[],
): readonly { preset: Preset; values: ReadonlyMap<string, OptionValue> }[] {
  return presets.map((preset) => ({ preset, values: valuesFor(preset, {}) }));
}

function renderAll(
  entries: readonly { preset: Preset; values: ReadonlyMap<string, OptionValue> }[],
  photo: HTMLCanvasElement,
): Map<string, PresetThumbnail> {
  const result = new Map<string, PresetThumbnail>();
  for (const { preset, values } of entries) result.set(preset.id, renderThumbnail(preset, values, photo));
  return result;
}

/**
 * 프리셋 카드에 쓸 그림입니다. 패널이 열릴 때 한 번 그려 두고 들고 있습니다.
 *
 * 글자 폭을 재는 데 서체가 필요한데, 준비되기 전에 그리면 대체 서체 폭으로 배치가
 * 계산됩니다. usePipeline 이 fontReady 로 같은 문제를 다루는 것과 같은 이유이지만,
 * usePipeline.ts 는 다른 작업이 건드리고 있어 여기서 따로 서체를 챙기고 준비된 뒤
 * 한 번 더 그립니다.
 */
export function usePresetThumbnails(presets: readonly Preset[]): ReadonlyMap<string, PresetThumbnail> {
  const [thumbnails, setThumbnails] = useState<ReadonlyMap<string, PresetThumbnail>>(() => new Map());

  useLayoutEffect(() => {
    const photo = makeSamplePhoto();
    const entries = valuesByPreset(presets);
    setThumbnails(renderAll(entries, photo));

    const fontIds = new Set(entries.map(({ values }) => fontIdOf(values)));
    let alive = true;
    void Promise.all(
      [...fontIds].map((id) =>
        ensureCanvasFontOnce(document.fonts as unknown as FontFaceSetLike, fontById(id), fontUrl(id)).catch(
          () => undefined,
        ),
      ),
    ).then(() => {
      if (alive) setThumbnails(renderAll(entries, photo));
    });

    return () => {
      alive = false;
    };
  }, [presets]);

  return thumbnails;
}
