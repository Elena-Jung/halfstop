import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  PRESETS,
  layoutFor,
  optionsFor,
  presetById,
  valuesFor,
} from './presets';
import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';

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

  it('모든 프리셋에 사람이 읽는 이름이 있습니다', () => {
    for (const preset of PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0);
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
