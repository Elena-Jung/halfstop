import { describe, expect, it } from 'vitest';
import { ellipsize, halfHeight, twoLineGap, twoLineHeight } from './primitives';
import type { LayoutServices, TextStyle } from './types';

describe('halfHeight', () => {
  it('크기에 비율 0.62를 곱합니다', () => {
    expect(halfHeight(34)).toBeCloseTo(21.08);
  });
});

describe('twoLineHeight', () => {
  it('큰 쪽 크기의 halfHeight 두 배와 같습니다', () => {
    expect(twoLineHeight(34, 23.8)).toBeCloseTo(halfHeight(34) * 2);
    // 인자 순서를 바꿔도 큰 쪽을 보므로 같은 값입니다.
    expect(twoLineHeight(23.8, 34)).toBeCloseTo(halfHeight(34) * 2);
  });
});

describe('twoLineGap', () => {
  it('넉넉한 높이에서는 wanted 를 돌려줍니다', () => {
    // wanted = max(34*1.25, halfHeight(34)+halfHeight(23.8)) = max(42.5, 35.836) = 42.5
    expect(twoLineGap(200, 34, 23.8)).toBeCloseTo(42.5);
  });

  it('좁은 높이에서는 room 을 돌려줍니다', () => {
    // room = 50 - twoLineHeight(34, 23.8) = 50 - 42.16 = 7.84
    expect(twoLineGap(50, 34, 23.8)).toBeCloseTo(7.84);
  });

  it('available 이 큰 쪽 한 줄보다 좁으면 0 을 돌려줍니다', () => {
    // twoLineHeight(34, 23.8) = 42.16 이므로 20 은 그보다 좁습니다.
    expect(twoLineGap(20, 34, 23.8)).toBe(0);
  });
});

const STYLE: TextStyle = {
  family: 'Test',
  size: 10,
  weight: 400,
  style: 'normal',
  color: '#000000',
  align: 'left',
  baseline: 'middle',
  alpha: 1,
};

/** 글자 하나를 폭 10으로 세는 가짜 측정기입니다. 결정적이라 테스트에 적합합니다. */
const services: LayoutServices = {
  measureText: (text) => text.length * 10,
  hasLogo: () => false,
};

describe('ellipsize', () => {
  it('폭이 남으면 그대로 둡니다', () => {
    expect(ellipsize('abc', 100, STYLE, services)).toBe('abc');
  });

  it('딱 맞으면 그대로 둡니다', () => {
    expect(ellipsize('abc', 30, STYLE, services)).toBe('abc');
  });

  it('넘치면 말줄임표를 붙입니다', () => {
    // 말줄임표가 폭 10을 먹으므로 40 안에는 글자 3개가 들어갑니다.
    expect(ellipsize('abcdef', 40, STYLE, services)).toBe('abc…');
  });

  it('말줄임표조차 못 넣을 폭이면 빈 문자열입니다', () => {
    expect(ellipsize('abcdef', 5, STYLE, services)).toBe('');
  });

  it('말줄임표 하나 크기의 폭이면 말줄임표만 남습니다', () => {
    // 말줄임표 폭이 정확히 10이라 예산은 0입니다. 원본 글자는 하나도
    // 못 들어가지만 폭 자체는 말줄임표를 담기에 충분합니다.
    expect(ellipsize('abcdef', 10, STYLE, services)).toBe('…');
  });

  it('말줄임표는 들어가지만 원본 글자는 아직 못 들어가는 폭이면 말줄임표만 남습니다', () => {
    expect(ellipsize('abcdef', 15, STYLE, services)).toBe('…');
  });

  it('빈 문자열은 빈 문자열입니다', () => {
    expect(ellipsize('', 100, STYLE, services)).toBe('');
  });

  it('폭이 0 이하면 빈 문자열입니다', () => {
    expect(ellipsize('abc', 0, STYLE, services)).toBe('');
  });
});
