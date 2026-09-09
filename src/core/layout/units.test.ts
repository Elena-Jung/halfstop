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
    expect(() => toUnits(100, Number.POSITIVE_INFINITY)).toThrow();
    expect(() => toUnits(Number.NEGATIVE_INFINITY, 100)).toThrow();
    expect(() => toUnits(100, Number.NEGATIVE_INFINITY)).toThrow();
  });

  it('곱셈 먼저 나눗셈 나중으로 정확한 값을 냅니다', () => {
    // (9000 * 1000) / 6000 = 9000000 / 6000 = 1500 (정확한 값)
    // (6000 * 1000) / 6000 = 6000000 / 6000 = 1000 (정확한 값)
    expect(toUnits(9000, 6000)).toEqual({ width: 1500, height: 1000 });
    // (3000 * 1000) / 3000 = 3000000 / 3000 = 1000 (정확한 값)
    expect(toUnits(3000, 3000)).toEqual({ width: 1000, height: 1000 });
  });

  it('연산 순서 회귀: 두 방식이 실제로 다른 결과를 내는 입력을 검증합니다', () => {
    // 2124, 1062를 사용합니다. 예전 방식(나눗셈 먼저)은 반올림 누적으로
    // 정확하지 않은 값을 내지만, 새로운 방식(곱셈 먼저)은 정확한 값을 냅니다.
    // 예전 방식: 1000 / 1062 = 0.9416195856873823...
    //           0.9416195856873823 * 2124 = 1999.9999999999998 (반올림 누적)
    // 새로운 방식: (2124 * 1000) / 1062 = 2000 (정확한 정수)
    expect(toUnits(2124, 1062)).toEqual({ width: 2000, height: 1000 });
  });

  it('예전 방식과 새로운 방식이 실제로 다른 값을 냅니다', () => {
    // 예전 구현을 참고용으로 재현합니다. 연산 순서 변경이 실제 효과를 내는지
    // 검증하고, 회귀 테스트가 의미 있다는 사실을 테스트로 고정합니다.
    function oldToUnitsApproach(
      pixelWidth: number,
      pixelHeight: number,
    ): { width: number; height: number } {
      const short = Math.min(pixelWidth, pixelHeight);
      const scale = 1000 / short;
      return {
        width: pixelWidth * scale,
        height: pixelHeight * scale,
      };
    }

    const newResult = toUnits(2124, 1062);
    const oldResult = oldToUnitsApproach(2124, 1062);

    // 새로운 방식이 정확한 정수 결과를 냅니다.
    expect(newResult).toEqual({ width: 2000, height: 1000 });

    // 예전 방식은 부동소수점 연산 누적으로 정확하지 않습니다.
    expect(oldResult.width).not.toBe(2000);
    expect(oldResult.height).not.toBe(1000);

    // 두 방식이 실제로 다릅니다.
    expect(newResult.width).not.toBe(oldResult.width);
    expect(newResult.height).not.toBe(oldResult.height);
  });

  it('상수를 노출합니다', () => {
    expect(UNITS_PER_SHORT_EDGE).toBe(1000);
  });
});
