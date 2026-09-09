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

  it('상수를 노출합니다', () => {
    expect(UNITS_PER_SHORT_EDGE).toBe(1000);
  });
});
