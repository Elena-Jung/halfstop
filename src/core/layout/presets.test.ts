import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  PRESETS,
  layoutFor,
  optionsFor,
  presetById,
  valuesFor,
} from './presets';
import { arrangementById } from './arrangements';
import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';
import type { LayoutInput, LayoutServices } from './types';

/** 배치가 통째로 정하는 여덟 값입니다. presets.ts 의 values 는 이 키를 담지 않습니다. */
const ARRANGEMENT_VALUE_KEYS = [
  'MODE',
  'ALIGN',
  'DIVIDER',
  'PRIMARY_MAIN',
  'PRIMARY_SUB',
  'SECONDARY_MAIN',
  'SECONDARY_SUB',
  'FOOTER',
];

describe('PRESETS', () => {
  it('아홉 개입니다', () => {
    expect(PRESETS).toHaveLength(9);
  });

  it('id 가 겹치지 않습니다', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(9);
  });

  it('바 계열이 여섯, 액자 계열이 셋입니다', () => {
    expect(PRESETS.filter((p) => p.layout === 'bar')).toHaveLength(6);
    expect(PRESETS.filter((p) => p.layout === 'matte')).toHaveLength(3);
  });

  it('모든 프리셋에 이름표 키가 있습니다', () => {
    for (const preset of PRESETS) {
      expect(preset.labelKey.length).toBeGreaterThan(0);
    }
  });

  it('선언에 없는 옵션 키를 값 묶음에 넣지 않습니다', () => {
    for (const preset of PRESETS) {
      const declared = new Set(optionsFor(preset).map((o) => o.id));
      for (const key of Object.keys(preset.values)) {
        expect(declared.has(key), `${preset.id} 의 ${key}`).toBe(true);
      }
    }
  });

  it('배치가 정하는 여덟 값을 values 에 두지 않습니다', () => {
    // 두 곳이 같은 값을 정하면 어느 쪽이 이기는지가 모호해집니다. 배치가 통째로
    // 정하도록 프리셋의 values 는 이 여덟 키를 아예 담지 않아야 합니다.
    for (const preset of PRESETS) {
      for (const key of ARRANGEMENT_VALUE_KEYS) {
        expect(Object.hasOwn(preset.values, key), `${preset.id} 의 ${key}`).toBe(false);
      }
    }
  });

  it('모든 프리셋의 arrangementId 가 그 프리셋의 레이아웃에서 쓸 수 있는 배치를 가리킵니다', () => {
    for (const preset of PRESETS) {
      const arrangement = arrangementById(preset.arrangementId);
      expect(arrangement.id, `${preset.id} 의 arrangementId`).toBe(preset.arrangementId);
      expect(arrangement.layouts, `${preset.id}: ${arrangement.id}`).toContain(preset.layout);
    }
  });
});

describe('presetById', () => {
  it('id 로 찾습니다', () => {
    expect(presetById(DEFAULT_PRESET_ID).id).toBe(DEFAULT_PRESET_ID);
  });

  it('모르는 id 는 기본 프리셋으로 떨어집니다', () => {
    expect(presetById('없는-id').id).toBe(DEFAULT_PRESET_ID);
  });
});

describe('optionsFor 와 layoutFor', () => {
  it('레이아웃에 맞는 선언과 함수를 돌려줍니다', () => {
    const bar = PRESETS.find((p) => p.layout === 'bar')!;
    const matte = PRESETS.find((p) => p.layout === 'matte')!;
    expect(optionsFor(bar)).toBe(BAR_OPTIONS);
    expect(layoutFor(bar)).toBe(barLayout);
    expect(optionsFor(matte)).toBe(MATTE_OPTIONS);
    expect(layoutFor(matte)).toBe(matteLayout);
  });
});

describe('프리셋 기본 문구', () => {
  // 완성형 한글 음절 범위입니다. 화면에 그려지는 값에 이 범위의 글자가 있으면
  // 안내 문구가 실수로 캔버스에 그려지는 것입니다.
  const HANGUL_SYLLABLE = /[가-힣]/;
  const TEXT_KEYS = ['PRIMARY_MAIN', 'PRIMARY_SUB', 'SECONDARY_MAIN', 'SECONDARY_SUB', 'FOOTER'];

  it('화면에 그려지는 기본 문구에 한국어 안내 문구가 없습니다', () => {
    for (const preset of PRESETS) {
      const values = valuesFor(preset, {});
      for (const key of TEXT_KEYS) {
        const value = values.get(key);
        if (typeof value !== 'string') continue; // 해당 레이아웃에 없는 키입니다.
        if (value.startsWith('{')) continue; // 템플릿 토큰은 문구가 아닙니다.
        expect(HANGUL_SYLLABLE.test(value), `${preset.id}.${key} = "${value}"`).toBe(false);
      }
    }
  });
});

describe('프리셋 값과 coerce', () => {
  it('모든 프리셋 값이 coerce 를 그대로 통과합니다', () => {
    for (const preset of PRESETS) {
      const values = valuesFor(preset, {});
      for (const [key, expected] of Object.entries(preset.values)) {
        expect(values.get(key), `${preset.id}.${key}`).toBe(expected);
      }
    }
  });
});

describe('valuesFor', () => {
  it('프리셋 값이 선언 기본값을 덮습니다', () => {
    const preset = presetById('minimal');
    const values = valuesFor(preset, {});
    expect(values.get('MODE')).toBe('single');
  });

  it('저장된 값이 프리셋 값을 덮습니다', () => {
    const preset = presetById('minimal');
    const values = valuesFor(preset, { BAR_HEIGHT: 300 });
    expect(values.get('BAR_HEIGHT')).toBe(300);
    expect(values.get('MODE')).toBe('single');
  });

  it('저장된 값이 이상하면 선언 기본값이 아니라 프리셋 값으로 떨어집니다', () => {
    const preset = presetById('minimal');
    const clean = valuesFor(preset, {});
    const dirty = valuesFor(preset, { BAR_HEIGHT: '높게', GHOST: 1 });
    // 미니멀은 바 높이를 80 으로 덮습니다. 선언 기본값 120 으로 돌아가면 안 됩니다.
    expect(dirty.get('BAR_HEIGHT')).toBe(clean.get('BAR_HEIGHT'));
    expect(dirty.get('BAR_HEIGHT')).toBe(80);
    expect(dirty.has('GHOST')).toBe(false);
  });
});

describe('프리셋 이름표 키', () => {
  it('아홉 프리셋이 preset. 으로 시작하는 키를 갖습니다', () => {
    for (const preset of PRESETS) {
      expect(preset.labelKey).toBe(`preset.${preset.id}`);
    }
  });

  it('한국어 문자열을 직접 담지 않습니다', () => {
    for (const preset of PRESETS) {
      expect(/[가-힣]/.test(preset.labelKey), preset.id).toBe(false);
    }
  });
});

describe('body-lens 프리셋의 좌우 대칭', () => {
  const services: LayoutServices = {
    measureText: (text, style) => text.length * style.size * 0.5,
    hasLogo: () => false,
  };

  function sceneTexts(fields: LayoutInput['fields']): string[] {
    const preset = presetById('body-lens');
    const input: LayoutInput = {
      photo: { width: 1500, height: 1000 },
      fields,
      logoId: undefined,
      options: valuesFor(preset, {}),
    };
    const scene = layoutFor(preset)(input, services);
    return scene.nodes.filter((node) => node.kind === 'text').map((node) => node.text);
  }

  it('사용자의 실제 사진처럼 렌즈 제조사를 알아내면 왼쪽처럼 오른쪽도 제조사와 모델 두 줄입니다', () => {
    // SONY ILCE-7M3 바디에 탐론 E 28-75mm F2.8 A063 렌즈. resolveLensMaker 가 LENS_MAKER 를
    // TAMRON 으로 채워 왔다고 가정합니다(map.test.ts 가 그 채움 자체를 검증합니다).
    expect(
      sceneTexts({
        MAKER: 'SONY',
        BODY: 'ILCE-7M3',
        LENS: 'E 28-75mm F2.8 A063',
        LENS_MAKER: 'TAMRON',
      }),
    ).toEqual(['SONY', 'ILCE-7M3', 'TAMRON', 'E 28-75mm F2.8 A063']);
  });

  it('렌즈 제조사를 못 알아내면 오른쪽이 렌즈 모델 한 줄로 접힙니다', () => {
    // LENS_MAKER 가 없는 경우입니다. 지금까지의 모습(오른쪽 한 줄)이 그대로 유지되어야
    // 합니다. resolveLensMaker 가 undefined 를 돌려주면 map.ts 가 이 키 자체를 넣지 않습니다.
    expect(
      sceneTexts({
        MAKER: 'SONY',
        BODY: 'ILCE-7M3',
        LENS: 'E 28-75mm F2.8 A063',
      }),
    ).toEqual(['SONY', 'ILCE-7M3', 'E 28-75mm F2.8 A063']);
  });
});

describe('아홉 프리셋의 장면 문구, 배치와 프레임을 나누기 전후로 같습니다', () => {
  // 프레임(감싸는 모양과 색)과 배치(어떤 정보가 어디 들어가는지)의 축을 나누는 것은 구조
  // 변경이지 겉모습 변경이 아닙니다. 배치를 아홉 프리셋에서 1:1 로 뽑은 이유가 이 보장이고,
  // 그것을 기계로 붙잡는 유일한 방법이 이 테스트입니다.
  //
  // 아래 문자열은 변경 전 코드(배치가 갈라지기 전, presets.ts 가 MODE/PRIMARY_MAIN 같은
  // 여덟 값을 직접 담던 시점)에서 같은 fields 로 실제로 뽑아낸 값입니다. 구현과 같은 식으로
  // 다시 계산하지 않고 값을 그대로 못박습니다.
  //
  // 예외 하나. poster 프리셋은 PRIMARY_SUB 가 비어 있어 matte 의 세 줄 경로를 타지
  // 않습니다(SUB_SCALE: 2.6 이 지금 아무 효과가 없습니다). 이 작업은 배치 축을 나누는
  // 구조 변경이므로 poster 의 PRIMARY_SUB 에 값을 넣지 않고 지금 모습을 그대로 유지하기로
  // 정했습니다. 세 줄로 채우는 것은 poster 프리셋의 모습을 바꾸는 별도 결정이 필요합니다.
  const services: LayoutServices = {
    measureText: (text, style) => text.length * style.size * 0.5,
    hasLogo: () => false,
  };

  const fields: LayoutInput['fields'] = {
    MAKER: 'SONY',
    BODY: 'ILCE-7M3',
    LENS: 'FE 24-70mm F2.8 GM',
    LENS_MAKER: 'SONY',
    MM: '35mm',
    F: 'f/2.8',
    SEC: '1/500s',
    ISO: 'ISO 200',
    TAKEN_AT: '2026-09-10 12:00',
  };

  const BEFORE: Record<string, string[]> = {
    'body-lens': ['SONY', 'ILCE-7M3', 'SONY', 'FE 24-70mm F2.8 GM', '35mm · f/2.8 · 1/500s · ISO 200'],
    'gear-exposure': ['SONY · ILCE-7M3', 'FE 24-70mm F2.8 GM', '35mm · f/2.8', '1/500s · ISO 200'],
    'one-line': ['SONY · ILCE-7M3 · 35mm · f/2.8 · 1/500s · ISO 200'],
    'shot-on': ['Shot on SONY · ILCE-7M3', '35mm · f/2.8 · 1/500s · ISO 200'],
    minimal: ['SONY ILCE-7M3'],
    film: ['2026-09-10 12:00', '35mm f/2.8 1/500s ISO 200'],
    polaroid: ['SONY · ILCE-7M3', '35mm · f/2.8 · 1/500s · ISO 200'],
    letterbox: ['SONY · ILCE-7M3 · 35mm · f/2.8'],
    poster: ['2026-09-10 12:00', 'SONY · ILCE-7M3 · 35mm'],
  };

  function sceneTextsFor(preset: (typeof PRESETS)[number]): string[] {
    const input: LayoutInput = {
      photo: { width: 1500, height: 1000 },
      fields,
      logoId: undefined,
      options: valuesFor(preset, {}),
    };
    const scene = layoutFor(preset)(input, services);
    return scene.nodes.filter((node) => node.kind === 'text').map((node) => node.text);
  }

  it('BEFORE 표가 아홉 프리셋을 모두 담습니다', () => {
    expect(Object.keys(BEFORE).sort()).toEqual(PRESETS.map((p) => p.id).sort());
  });

  for (const preset of PRESETS) {
    it(`${preset.id} 의 장면 문구가 그대로입니다`, () => {
      expect(sceneTextsFor(preset)).toEqual(BEFORE[preset.id]);
    });
  }
});
