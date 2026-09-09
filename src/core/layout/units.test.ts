import { describe, expect, it } from 'vitest';
import { toUnits, UNITS_PER_SHORT_EDGE } from './units';

describe('toUnits', () => {
  it('가로 사진의 짧은 변을 1000으로 맞춥니다', () => {
    expect(toUnits(6000, 4000)).toEqual({ width: 1500, height: 1000 });
  });

  it('세로 사진의 짧은 변을 1000으로 맞춥니다', () => {
    expect(toUnits(4000, 6000)).toEqual({ width: 1000, height: 1500 });
  });

  it('정사각형은 양변이 1000입니다', () => {
    expect(toUnits(3000, 3000)).toEqual({ width: 1000, height: 1000 });
  });

  it('화소수가 달라도 비율이 같으면 같은 결과를 냅니다', () => {
    expect(toUnits(1200, 800)).toEqual(toUnits(9000, 6000));
  });

  it('0 이하 입력은 거부합니다', () => {
    expect(() => toUnits(0, 100)).toThrow();
    expect(() => toUnits(100, -1)).toThrow();
  });

  it('반대 조합도 0 이하 입력을 거부합니다', () => {
    expect(() => toUnits(-1, 100)).toThrow();
    expect(() => toUnits(100, 0)).toThrow();
  });

  it('NaN 입력은 거부합니다', () => {
    expect(() => toUnits(Number.NaN, 100)).toThrow();
    expect(() => toUnits(100, Number.NaN)).toThrow();
  });

  it('Infinity 입력은 거부합니다', () => {
    expect(() => toUnits(Number.POSITIVE_INFINITY, 100)).toThrow();
  });

  it('곱셈 먼저 나눗셈 나중으로 정확한 값을 냅니다', () => {
    // (9000 * 1000) / 6000 = 9000000 / 6000 = 1500 (정확한 값)
    // (6000 * 1000) / 6000 = 6000000 / 6000 = 1000 (정확한 값)
    expect(toUnits(9000, 6000)).toEqual({ width: 1500, height: 1000 });
    // (3000 * 1000) / 3000 = 3000000 / 3000 = 1000 (정확한 값)
    expect(toUnits(3000, 3000)).toEqual({ width: 1000, height: 1000 });
  });

  it('상수를 노출합니다', () => {
    expect(UNITS_PER_SHORT_EDGE).toBe(1000);
  });
});
