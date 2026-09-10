import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';
import { mergeValues, type OptionValue, type PresetOption } from './options';
import type { PresetLayout } from './types';

export interface Preset {
  id: string;
  /** 지금은 한국어 문자열입니다. 다음 계획에서 번역 키로 바뀝니다. */
  label: string;
  layout: 'bar' | 'matte';
  /** 레이아웃 선언의 기본값 위에 덮어쓸 값입니다. */
  values: Record<string, OptionValue>;
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'body-lens',
    label: '바디와 렌즈',
    layout: 'bar',
    values: {
      MODE: 'split',
      PRIMARY_MAIN: '{MAKER}',
      PRIMARY_SUB: '{BODY}',
      SECONDARY_MAIN: '{LENS}',
      SECONDARY_SUB: '',
      FOOTER: '{MM}{F}{SEC}{ISO}',
      BAR_HEIGHT: 170,
    },
  },
  {
    id: 'gear-exposure',
    label: '장비와 노출',
    layout: 'bar',
    values: {
      MODE: 'split',
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '{LENS}',
      SECONDARY_MAIN: '{MM}{F}',
      SECONDARY_SUB: '{SEC}{ISO}',
      FOOTER: '',
      BAR_HEIGHT: 140,
    },
  },
  {
    id: 'one-line',
    label: '한 줄',
    layout: 'bar',
    values: {
      MODE: 'single',
      ALIGN: 'center',
      PRIMARY_MAIN: '{MAKER}{BODY}{MM}{F}{SEC}{ISO}',
      PRIMARY_SUB: '',
      BAR_HEIGHT: 90,
      FONT_SIZE: 28,
    },
  },
  {
    id: 'shot-on',
    label: 'Shot on',
    layout: 'bar',
    values: {
      MODE: 'single',
      ALIGN: 'center',
      PRIMARY_MAIN: 'Shot on {MAKER}{BODY}',
      PRIMARY_SUB: '{MM}{F}{SEC}{ISO}',
      BAR_HEIGHT: 160,
      FONT_SIZE: 40,
      FONT_WEIGHT: 600,
      SUB_SCALE: 0.55,
    },
  },
  {
    id: 'minimal',
    label: '미니멀',
    layout: 'bar',
    values: {
      MODE: 'single',
      ALIGN: 'left',
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '',
      BAR_HEIGHT: 80,
      FONT_SIZE: 24,
      FONT_WEIGHT: 300,
      TEXT_COLOR: '#888888',
      DIVIDER: '',
    },
  },
  {
    id: 'film',
    label: '필름 데이터백',
    layout: 'bar',
    values: {
      MODE: 'split',
      PRIMARY_MAIN: '{TAKEN_AT}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      BACKGROUND: '#000000',
      TEXT_COLOR: '#ff9500',
      FONT_FAMILY: 'jetbrains-mono',
      FONT_SIZE: 30,
      BAR_HEIGHT: 100,
      DIVIDER: '',
    },
  },
  {
    id: 'polaroid',
    label: '폴라로이드',
    layout: 'matte',
    values: {
      MODE: 'split',
      PAD_TOP: 70,
      PAD_RIGHT: 70,
      PAD_BOTTOM: 240,
      PAD_LEFT: 70,
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
    },
  },
  {
    id: 'letterbox',
    label: '레터박스',
    layout: 'matte',
    values: {
      MODE: 'single',
      ALIGN: 'center',
      PAD_TOP: 160,
      PAD_RIGHT: 0,
      PAD_BOTTOM: 160,
      PAD_LEFT: 0,
      BACKGROUND: '#000000',
      TEXT_COLOR: '#c8c8c8',
      PRIMARY_MAIN: '{MAKER}{BODY}{MM}{F}',
      PRIMARY_SUB: '',
      FONT_SIZE: 26,
    },
  },
  {
    id: 'poster',
    label: '포스터',
    layout: 'matte',
    values: {
      MODE: 'poster',
      ALIGN: 'left',
      PAD_TOP: 120,
      PAD_RIGHT: 120,
      PAD_BOTTOM: 420,
      PAD_LEFT: 120,
      BACKGROUND: '#f4f2ee',
      PRIMARY_MAIN: '{TAKEN_AT}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MAKER}{BODY}{MM}',
      SECONDARY_SUB: '',
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
 */
export function valuesFor(
  preset: Preset,
  stored: Record<string, unknown>,
): Map<string, OptionValue> {
  const declared = optionsFor(preset);
  // 두 번에 나눠 덮습니다. 한 객체로 합쳐 넘기면 저장된 값 하나가 이상할 때 그 자리가
  // 프리셋 값이 아니라 선언 기본값으로 떨어집니다.
  const base = mergeValues(declared, preset.values);
  return mergeValues(declared, stored, base);
}
