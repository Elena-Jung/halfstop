import { arrangementById, arrangementValuesFor } from './arrangements';
import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';
import { mergeValues, type OptionValue, type PresetOption } from './options';
import type { PresetLayout } from './types';

export interface Preset {
  id: string;
  /** 화면에 보일 이름의 번역 키입니다. */
  labelKey: string;
  layout: 'bar' | 'matte';
  /** 이 프리셋이 가리키는 배치입니다. 어떤 정보가 어디 들어가는지는 여기서 정합니다. */
  arrangementId: string;
  /**
   * 레이아웃 선언의 기본값 위에 덮어쓸 값입니다. 배치가 정하는 여덟 값(MODE, ALIGN,
   * DIVIDER, PRIMARY_MAIN, PRIMARY_SUB, SECONDARY_MAIN, SECONDARY_SUB, FOOTER)은 여기
   * 두지 않습니다. 두 곳이 같은 값을 정하면 어느 쪽이 이기는지가 모호해지기 때문입니다.
   */
  values: Record<string, OptionValue>;
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'body-lens',
    labelKey: 'preset.body-lens',
    layout: 'bar',
    arrangementId: 'body-lens',
    values: {
      BAR_HEIGHT: 170,
    },
  },
  {
    id: 'gear-exposure',
    labelKey: 'preset.gear-exposure',
    layout: 'bar',
    arrangementId: 'gear-exposure',
    values: {
      BAR_HEIGHT: 140,
    },
  },
  {
    id: 'one-line',
    labelKey: 'preset.one-line',
    layout: 'bar',
    arrangementId: 'one-line',
    values: {
      BAR_HEIGHT: 90,
      FONT_SIZE: 28,
    },
  },
  {
    id: 'shot-on',
    labelKey: 'preset.shot-on',
    layout: 'bar',
    arrangementId: 'shot-on',
    values: {
      BAR_HEIGHT: 160,
      FONT_SIZE: 40,
      FONT_WEIGHT: 600,
      SUB_SCALE: 0.55,
    },
  },
  {
    id: 'minimal',
    labelKey: 'preset.minimal',
    layout: 'bar',
    arrangementId: 'minimal',
    values: {
      BAR_HEIGHT: 80,
      FONT_SIZE: 24,
      FONT_WEIGHT: 300,
      TEXT_COLOR: '#888888',
    },
  },
  {
    id: 'film',
    labelKey: 'preset.film',
    layout: 'bar',
    arrangementId: 'film',
    values: {
      BACKGROUND: '#000000',
      TEXT_COLOR: '#ff9500',
      FONT_FAMILY: 'jetbrains-mono',
      FONT_SIZE: 30,
      BAR_HEIGHT: 100,
    },
  },
  {
    id: 'polaroid',
    labelKey: 'preset.polaroid',
    layout: 'matte',
    arrangementId: 'polaroid',
    values: {
      PAD_TOP: 70,
      PAD_RIGHT: 70,
      PAD_BOTTOM: 240,
      PAD_LEFT: 70,
    },
  },
  {
    id: 'letterbox',
    labelKey: 'preset.letterbox',
    layout: 'matte',
    arrangementId: 'letterbox',
    values: {
      PAD_TOP: 160,
      PAD_RIGHT: 0,
      PAD_BOTTOM: 160,
      PAD_LEFT: 0,
      BACKGROUND: '#000000',
      TEXT_COLOR: '#c8c8c8',
      FONT_SIZE: 26,
    },
  },
  {
    id: 'poster',
    labelKey: 'preset.poster',
    layout: 'matte',
    arrangementId: 'poster',
    values: {
      PAD_TOP: 120,
      PAD_RIGHT: 120,
      PAD_BOTTOM: 420,
      PAD_LEFT: 120,
      BACKGROUND: '#f4f2ee',
      FONT_SIZE: 26,
      SUB_SCALE: 2.6,
    },
  },
];

export const DEFAULT_PRESET_ID = 'body-lens';

/** 저장된 설정에 없는 id 가 남아 있어도 화면이 비지 않도록 기본값으로 떨어집니다. */
export function presetById(id: string): Preset {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0]!;
}

export function optionsFor(preset: Preset): readonly PresetOption[] {
  return preset.layout === 'bar' ? BAR_OPTIONS : MATTE_OPTIONS;
}

export function layoutFor(preset: Preset): PresetLayout {
  return preset.layout === 'bar' ? barLayout : matteLayout;
}

/**
 * 값은 세 겹으로 쌓입니다. 레이아웃 선언의 기본값, 프리셋이 덮는 값, 사용자가 저장한 값
 * 순입니다. 저장된 값은 낡았거나 손으로 고쳤을 수 있으므로 mergeValues 가 걸러냅니다.
 *
 * "프리셋이 덮는 값" 겹은 다시 둘로 나뉩니다. 프리셋이 가리키는 배치가 먼저 여덟 값을
 * 통째로 놓고, 그 위에 프리셋 자신의 값(대개 프레임 쪽)이 얹힙니다. 배치가 정하는 여덟
 * 값은 preset.values 에 없으므로 순서가 뒤바뀌어도 서로 부딪히지 않습니다.
 */
export function valuesFor(
  preset: Preset,
  stored: Record<string, unknown>,
): Map<string, OptionValue> {
  const declared = optionsFor(preset);
  const arrangement = arrangementById(preset.arrangementId);
  const arrangementValues = arrangementValuesFor(arrangement, preset.layout);
  // 세 번에 나눠 덮습니다. 한 객체로 합쳐 넘기면 저장된 값 하나가 이상할 때 그 자리가
  // 프리셋 값이 아니라 선언 기본값으로 떨어집니다.
  const withArrangement = mergeValues(declared, arrangementValues);
  const base = mergeValues(declared, preset.values, withArrangement);
  return mergeValues(declared, stored, base);
}
