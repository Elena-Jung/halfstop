import { describe, expect, it } from 'vitest';
import { LOGOS } from './logoData';
import { LOGO_MAX_ASPECT, hasLogo, logoArt, logoMark } from './registry';

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

describe('logoMark', () => {
  it('가로로 긴 워드마크도 높이를 다 씁니다', () => {
    // 소니 PNG 는 512x90 이라 5.69대 1 입니다. 상한 6 아래라 높이가 markHeight 그대로이고
    // 폭이 그 비를 따릅니다. 45 * 512 / 90 = 256 입니다.
    //
    // 이것이 이 함수가 생긴 이유입니다. 1.5대 1 상자에 맞춰 넣던 시절에는 폭에 먼저 걸려
    // 45 * 1.5 / 5.688... = 11.86 으로, 높이의 4분의 1 로 뭉개졌습니다.
    expect(logoMark({ width: 512, height: 90 }, 45)).toEqual({ width: 256, height: 45, y: 0 });
  });

  it('정사각형 로고는 높이와 같은 폭을 씁니다', () => {
    // 니콘과 라이카가 512x512 입니다.
    expect(logoMark({ width: 512, height: 512 }, 40)).toEqual({ width: 40, height: 40, y: 0 });
  });

  it('세로로 긴 로고도 높이를 다 씁니다', () => {
    // 애플 PNG 는 417x512 로 0.814대 1 입니다. 40 * 417 / 512 = 32.578125 입니다.
    const mark = logoMark({ width: 417, height: 512 }, 40);
    expect(mark.width).toBeCloseTo(32.578125, 9);
    expect(mark.height).toBe(40);
    expect(mark.y).toBe(0);
  });

  it('상한을 넘는 로고는 폭에 맞춰 줄이고 남는 높이를 위아래로 나눕니다', () => {
    // 핫셀블라드 PNG 는 512x40 이라 12.8대 1 입니다. 상한 6 에 걸려 폭이 40 * 6 = 240 이
    // 되고 높이는 240 / 12.8 = 18.75 입니다. 남는 40 - 18.75 = 21.25 를 반씩 나눠
    // 위에 10.625 가 붙습니다.
    expect(logoMark({ width: 512, height: 40 }, 40)).toEqual({
      width: 240,
      height: 18.75,
      y: 10.625,
    });
  });

  it('상한에 걸린 로고도 가로세로 비를 지킵니다', () => {
    // 고프로 PNG 는 512x70 으로 7.31대 1 입니다. 폭 35 * 6 = 210 에서
    // 높이는 210 * 70 / 512 = 28.7109375 이고, 210 / 28.7109375 = 7.31... 로 비가 같습니다.
    const mark = logoMark({ width: 512, height: 70 }, 35);
    expect(mark.width).toBe(210);
    expect(mark.height).toBeCloseTo(28.7109375, 9);
    expect(mark.width / mark.height).toBeCloseTo(512 / 70, 9);
  });

  it('폭은 언제나 높이의 상한 배를 넘지 않습니다', () => {
    for (const logo of LOGOS) {
      const mark = logoMark(logo, 40);
      expect(mark.width, logo.id).toBeLessThanOrEqual(40 * LOGO_MAX_ASPECT + 1e-9);
      expect(mark.height, logo.id).toBeLessThanOrEqual(40 + 1e-9);
      // 높이를 내주는 것은 상한을 넘는 로고뿐입니다.
      if (logo.width / logo.height <= LOGO_MAX_ASPECT) expect(mark.height, logo.id).toBe(40);
    }
  });

  it('markHeight 가 0 이면 폭도 0 입니다', () => {
    // 여백 액자에서 아래 여백을 0 까지 줄이면 이 값이 들어옵니다. 마크가 통째로 빠집니다.
    expect(logoMark({ width: 512, height: 90 }, 0)).toEqual({ width: 0, height: 0, y: 0 });
  });
});
