import { describe, expect, it } from 'vitest';
import { contrastRatio } from './contrast';

/**
 * WCAG 명세의 계산식을 알려진 값으로 검증합니다. 검정과 흰색의 명암비는 정확히 21:1이고
 * 같은 색끼리는 정확히 1:1입니다. #777777과 흰색은 약 4.48:1이라 AA 기준 4.5:1에
 * 아슬하게 미달합니다.
 */
describe('contrastRatio', () => {
  it('검정과 흰색은 21:1입니다', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
  });

  it('같은 색끼리는 1:1입니다', () => {
    expect(contrastRatio('#4a9eff', '#4a9eff')).toBe(1);
  });

  it('#777777과 흰색은 약 4.48:1로 AA 기준에 미달합니다', () => {
    const ratio = contrastRatio('#777777', '#ffffff');
    expect(ratio).toBeCloseTo(4.48, 2);
    expect(ratio).toBeLessThan(4.5);
  });
});
