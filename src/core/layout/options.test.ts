import { describe, expect, it } from 'vitest';
import { bool, defaultValues, mergeValues, num, str, type PresetOption } from './options';

const SCHEMA: PresetOption[] = [
  { id: 'BACKGROUND', type: 'color', default: '#ffffff' },
  { id: 'BAR_HEIGHT', type: 'number', default: 120, unit: 'u' },
  { id: 'SHOW_LOGO', type: 'boolean', default: true },
  { id: 'ALIGN', type: 'select', options: ['left', 'center'], default: 'left' },
  { id: 'WEIGHT', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'LABEL', type: 'text', default: '' },
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
