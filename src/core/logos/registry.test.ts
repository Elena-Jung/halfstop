import { describe, expect, it } from 'vitest';
import { LOGOS } from './logoData';
import { fitLogoBox, hasLogo, logoParts } from './registry';

describe('hasLogo', () => {
  it('데이터에 있는 브랜드는 참입니다', () => {
    expect(hasLogo('sony')).toBe(true);
  });

  it('데이터에 없는 브랜드는 거짓입니다', () => {
    // OM 시스템은 흰 글자를 어두운 배지 위에 얹은 두 색 디자인뿐이라 단색으로는
    // 못 그립니다. bar.ts 가 이 자리에서 워드마크로 대체합니다.
    expect(hasLogo('om-system')).toBe(false);
  });
});

describe('logoParts', () => {
  it('조각들과 viewBox 를 돌려줍니다', () => {
    const sony = LOGOS.find((logo) => logo.id === 'sony')!;
    expect(logoParts('sony')).toEqual({ parts: sony.parts, viewBox: sony.viewBox });
  });

  it('조각의 행렬을 그대로 실어 보냅니다', () => {
    // 캐논은 원본 <g> 에 matrix 가 걸려 있어 행렬 없이는 글자가 어긋납니다. 이 값이
    // 그리는 쪽까지 닿는지 봅니다.
    const canon = logoParts('canon')!;
    expect(canon.parts.length).toBeGreaterThan(0);
    for (const part of canon.parts) {
      expect(part.transform).toEqual([1.2500506, 0, 0, 1.2500506, 0, -0.00246783]);
    }
  });

  it('없는 브랜드는 undefined 입니다', () => {
    expect(logoParts('om-system')).toBeUndefined();
  });
});

describe('fitLogoBox', () => {
  it('정사각형 viewBox 를 정사각형 상자에 꽉 채웁니다', () => {
    expect(fitLogoBox({ width: 24, height: 24 }, { width: 1, height: 1 })).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it('가로가 아주 긴 viewBox(pentax)는 위아래에 여백을 두고 가운데 정렬합니다', () => {
    // scale = min(1/2560, 1/513) = 1/2560. width = 2560 * 1/2560 = 1,
    // height = 513 * 1/2560 = 0.2003906250. x = (1-1)/2 = 0, y = (1-0.200390625)/2.
    const fit = fitLogoBox({ width: 2560, height: 513 }, { width: 1, height: 1 });
    expect(fit.width).toBeCloseTo(1, 9);
    expect(fit.height).toBeCloseTo(0.200390625, 9);
    expect(fit.x).toBeCloseTo(0, 9);
    expect(fit.y).toBeCloseTo(0.3998046875, 9);
  });

  it('세로가 긴 viewBox 를 정사각형이 아닌 상자에 넣어도 가로세로 비를 지키며 가운데 정렬합니다', () => {
    // scale = min(10/24, 10/48) = 5/24. width = 24 * 5/24 = 5, height = 48 * 5/24 = 10.
    // x = (10-5)/2 = 2.5, y = (10-10)/2 = 0.
    const fit = fitLogoBox({ width: 24, height: 48 }, { width: 10, height: 10 });
    expect(fit).toEqual({ x: 2.5, y: 0, width: 5, height: 10 });
  });
});
