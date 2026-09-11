import { describe, expect, it } from 'vitest';
import { LOGOS } from './logoData';
import { fitLogoBox, hasLogo, logoArt } from './registry';

describe('hasLogo', () => {
  it('데이터에 있는 브랜드는 참입니다', () => {
    expect(hasLogo('sony')).toBe(true);
  });

  it('데이터에 없는 브랜드는 거짓입니다', () => {
    expect(hasLogo('kodak')).toBe(false);
  });
});

describe('logoArt', () => {
  it('그 브랜드의 명세를 그대로 돌려줍니다', () => {
    expect(logoArt('sony')).toBe(LOGOS.find((logo) => logo.id === 'sony'));
  });

  it('없는 브랜드는 undefined 입니다', () => {
    expect(logoArt('kodak')).toBeUndefined();
  });
});

describe('fitLogoBox', () => {
  it('정사각형 로고를 정사각형 상자에 꽉 채웁니다', () => {
    expect(fitLogoBox({ width: 512, height: 512 }, { width: 1, height: 1 })).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it('가로가 아주 긴 로고(핫셀블라드)는 위아래에 여백을 두고 가운데 정렬합니다', () => {
    // 핫셀블라드 PNG 는 512x40 입니다. scale = min(1/512, 1/40) = 1/512 이라
    // width = 1, height = 40/512 = 0.078125 이고, y = (1 - 0.078125)/2 = 0.4609375 입니다.
    const fit = fitLogoBox({ width: 512, height: 40 }, { width: 1, height: 1 });
    expect(fit.width).toBeCloseTo(1, 9);
    expect(fit.height).toBeCloseTo(0.078125, 9);
    expect(fit.x).toBeCloseTo(0, 9);
    expect(fit.y).toBeCloseTo(0.4609375, 9);
  });

  it('세로가 긴 로고를 정사각형이 아닌 상자에 넣어도 가로세로 비를 지키며 가운데 정렬합니다', () => {
    // scale = min(10/24, 10/48) = 5/24. width = 24 * 5/24 = 5, height = 48 * 5/24 = 10.
    // x = (10-5)/2 = 2.5, y = (10-10)/2 = 0.
    const fit = fitLogoBox({ width: 24, height: 48 }, { width: 10, height: 10 });
    expect(fit).toEqual({ x: 2.5, y: 0, width: 5, height: 10 });
  });
});
