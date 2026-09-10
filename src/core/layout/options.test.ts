import { describe, expect, it } from 'vitest';
import { bool, defaultValues, mergeValues, num, str, type PresetOption } from './options';
import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';
import type { LayoutInput, LayoutServices } from './types';

const SCHEMA: PresetOption[] = [
  { id: 'BACKGROUND', labelKey: 'option.BACKGROUND', groupKey: 'frame', type: 'color', default: '#ffffff' },
  { id: 'BAR_HEIGHT', labelKey: 'option.BAR_HEIGHT', groupKey: 'frame', type: 'number', default: 120, unit: 'u', min: 40, max: 500 },
  { id: 'SHOW_LOGO', labelKey: 'option.SHOW_LOGO', groupKey: 'frame', type: 'boolean', default: true },
  { id: 'ALIGN', labelKey: 'option.ALIGN', groupKey: 'arrangement', type: 'select', options: ['left', 'center'], default: 'left' },
  { id: 'WEIGHT', labelKey: 'option.WEIGHT', groupKey: 'arrangement', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'LABEL', labelKey: 'option.LABEL', groupKey: 'arrangement', type: 'text', default: '' },
];

describe('defaultValues', () => {
  it('선언에 적힌 기본값을 그대로 담습니다', () => {
    const values = defaultValues(SCHEMA);
    expect(values.get('BACKGROUND')).toBe('#ffffff');
    expect(values.get('BAR_HEIGHT')).toBe(120);
    expect(values.get('SHOW_LOGO')).toBe(true);
    expect(values.size).toBe(6);
  });
});

describe('mergeValues', () => {
  it('저장된 값으로 덮어씁니다', () => {
    const values = mergeValues(SCHEMA, { BAR_HEIGHT: 200 });
    expect(values.get('BAR_HEIGHT')).toBe(200);
    expect(values.get('BACKGROUND')).toBe('#ffffff');
  });

  it('선언에 없는 키는 버립니다', () => {
    const values = mergeValues(SCHEMA, { GHOST: 1 });
    expect(values.has('GHOST')).toBe(false);
  });

  it('타입이 다른 값은 무시하고 기본값을 씁니다', () => {
    const values = mergeValues(SCHEMA, { BAR_HEIGHT: 'tall', SHOW_LOGO: 'yes' });
    expect(values.get('BAR_HEIGHT')).toBe(120);
    expect(values.get('SHOW_LOGO')).toBe(true);
  });

  it('select 목록에 없는 값은 무시합니다', () => {
    expect(mergeValues(SCHEMA, { ALIGN: 'right' }).get('ALIGN')).toBe('left');
    expect(mergeValues(SCHEMA, { ALIGN: 'center' }).get('ALIGN')).toBe('center');
  });

  it('range 범위를 벗어난 값은 잘라 냅니다', () => {
    expect(mergeValues(SCHEMA, { WEIGHT: 5000 }).get('WEIGHT')).toBe(900);
    expect(mergeValues(SCHEMA, { WEIGHT: 0 }).get('WEIGHT')).toBe(100);
  });

  it('유한하지 않은 수는 무시합니다', () => {
    expect(mergeValues(SCHEMA, { BAR_HEIGHT: Number.NaN }).get('BAR_HEIGHT')).toBe(120);
  });
});

describe('mergeValues 의 시작값', () => {
  it('시작값 위에 저장된 값을 덮습니다', () => {
    const base = mergeValues(SCHEMA, { BAR_HEIGHT: 80 });
    const merged = mergeValues(SCHEMA, { BACKGROUND: '#000000' }, base);
    expect(merged.get('BACKGROUND')).toBe('#000000');
    expect(merged.get('BAR_HEIGHT')).toBe(80);
  });

  it('이상한 저장값은 선언 기본값이 아니라 시작값으로 떨어집니다', () => {
    const base = mergeValues(SCHEMA, { BAR_HEIGHT: 80 });
    const merged = mergeValues(SCHEMA, { BAR_HEIGHT: '높게' }, base);
    // 선언 기본값 120 으로 돌아가면 안 됩니다.
    expect(merged.get('BAR_HEIGHT')).toBe(80);
  });
});

describe('number 옵션 범위', () => {
  it('min 보다 작은 값을 저장해 두면 min 으로 조여집니다', () => {
    expect(mergeValues(SCHEMA, { BAR_HEIGHT: -2000 }).get('BAR_HEIGHT')).toBe(40);
  });

  it('max 보다 큰 값을 저장해 두면 max 로 조여집니다', () => {
    expect(mergeValues(SCHEMA, { BAR_HEIGHT: 9000 }).get('BAR_HEIGHT')).toBe(500);
  });

  it('모든 number 옵션에서 min 이 0 이상이고 min 이 max 보다 작으며 default 가 그 사이에 있습니다', () => {
    for (const options of [BAR_OPTIONS, MATTE_OPTIONS]) {
      for (const option of options) {
        if (option.type !== 'number') continue;
        expect(option.min, `${option.id}.min`).toBeGreaterThanOrEqual(0);
        expect(option.min, `${option.id}.min < max`).toBeLessThan(option.max);
        expect(option.default, `${option.id}.default >= min`).toBeGreaterThanOrEqual(option.min);
        expect(option.default, `${option.id}.default <= max`).toBeLessThanOrEqual(option.max);
      }
    }
  });

  it('두 레이아웃 함수가 각 number 옵션의 min 과 max 양 끝값에서 장면 크기를 0 보다 크게 냅니다', () => {
    const services: LayoutServices = {
      measureText: (text, style) => text.length * style.size * 0.5,
      hasLogo: () => false,
    };
    const baseInput: LayoutInput = {
      photo: { width: 1500, height: 1000 },
      fields: { MAKER: 'Canon', BODY: 'EOS R6' },
      logoId: undefined,
      options: defaultValues(BAR_OPTIONS),
    };

    const cases: Array<{ options: readonly PresetOption[]; layout: typeof barLayout }> = [
      { options: BAR_OPTIONS, layout: barLayout },
      { options: MATTE_OPTIONS, layout: matteLayout },
    ];

    for (const { options: declared, layout } of cases) {
      for (const option of declared) {
        if (option.type !== 'number') continue;
        for (const bound of [option.min, option.max]) {
          const values = defaultValues(declared);
          values.set(option.id, bound);
          const scene = layout({ ...baseInput, options: values }, services);
          expect(scene.width, `${option.id}=${bound} width`).toBeGreaterThan(0);
          expect(scene.height, `${option.id}=${bound} height`).toBeGreaterThan(0);
        }
      }
    }
  });
});

describe('접근 헬퍼', () => {
  it('타입에 맞는 값을 꺼냅니다', () => {
    const values = defaultValues(SCHEMA);
    expect(num(values, 'BAR_HEIGHT')).toBe(120);
    expect(str(values, 'BACKGROUND')).toBe('#ffffff');
    expect(bool(values, 'SHOW_LOGO')).toBe(true);
  });

  it('없는 키를 꺼내면 던집니다', () => {
    const values = defaultValues(SCHEMA);
    expect(() => num(values, 'NOPE')).toThrow('NOPE');
  });
});

describe('이름표 키와 묶음 키', () => {
  const ALL = [...BAR_OPTIONS, ...MATTE_OPTIONS];

  it('모든 옵션이 labelKey 와 groupKey 를 갖습니다', () => {
    for (const option of ALL) {
      expect(option.labelKey, option.id).toBeTruthy();
      expect(['frame', 'arrangement']).toContain(option.groupKey);
    }
  });

  it('labelKey 는 option. 으로 시작하고 id 를 그대로 씁니다', () => {
    for (const option of ALL) {
      expect(option.labelKey).toBe(`option.${option.id}`);
    }
  });

  it('같은 id 는 두 레이아웃에서 같은 묶음에 들어갑니다', () => {
    const seen = new Map<string, string>();
    for (const option of ALL) {
      const previous = seen.get(option.id);
      if (previous !== undefined) expect(option.groupKey, option.id).toBe(previous);
      seen.set(option.id, option.groupKey);
    }
  });
});
