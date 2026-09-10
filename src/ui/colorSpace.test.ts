import { describe, expect, it } from 'vitest';
import { clampHsv, hexToHsv, hsvToHex, type Hsv } from './colorSpace';

/**
 * 결정론적 의사난수 생성기입니다. 성질 기반 검사에서 매번 같은 표본을 뽑기 위한 것으로,
 * 외부 라이브러리 없이 왕복 검사를 넓게 돌리는 용도입니다.
 */
function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomHex(rand: () => number): string {
  const byte = () => Math.floor(rand() * 256);
  return `#${[byte(), byte(), byte()].map((n) => n.toString(16).padStart(2, '0')).join('')}`;
}

// 이 저장소가 실제로 쓰는 색입니다. src/assets/ui.css 의 :root 토큰 아홉 개와
// src/core/layout/presets.ts 및 레이아웃 선언의 프리셋 색입니다.
const REPO_COLORS = [
  '#14161a',
  '#1c1f24',
  '#262b32',
  '#5f6b78',
  '#e8eaed',
  '#a8b0ba',
  '#4a9eff',
  '#08131f',
  '#ff8a8a',
  '#888888',
  '#000000',
  '#ff9500',
  '#c8c8c8',
  '#f4f2ee',
  '#ffffff',
  '#111111',
];

const NAMED_COLORS = [
  '#000000',
  '#ffffff',
  '#ff0000',
  '#00ff00',
  '#0000ff',
  '#ffff00', // 색상각 60도, hsvToHex 의 분기 경계입니다.
  '#00ffff', // 색상각 180도, 분기 경계입니다.
  '#ff00ff', // 색상각 300도, 분기 경계입니다.
  '#808080',
  '#404040',
  '#202020',
  '#c0c0c0',
];

describe('hexToHsv', () => {
  it('#을 붙이지 않아도 파싱합니다', () => {
    expect(hexToHsv('ff0000')).toEqual(hexToHsv('#ff0000'));
  });

  it('세 자리 축약을 여섯 자리와 같게 파싱합니다', () => {
    expect(hexToHsv('#fff')).toEqual(hexToHsv('#ffffff'));
    expect(hexToHsv('#f0a')).toEqual(hexToHsv('#ff00aa'));
  });

  it('대소문자를 가리지 않습니다', () => {
    expect(hexToHsv('#FFAA00')).toEqual(hexToHsv('#ffaa00'));
    expect(hexToHsv('#AbC')).toEqual(hexToHsv('#aabbcc'));
  });

  it('순수한 빨강은 색상각 0도입니다', () => {
    const hsv = hexToHsv('#ff0000');
    expect(hsv).toBeDefined();
    expect(hsv!.h).toBe(0);
    expect(hsv!.s).toBe(1);
    expect(hsv!.v).toBe(1);
  });

  it('순수한 초록은 색상각 120도입니다', () => {
    const hsv = hexToHsv('#00ff00');
    expect(hsv!.h).toBeCloseTo(120, 6);
  });

  it('순수한 파랑은 색상각 240도입니다', () => {
    const hsv = hexToHsv('#0000ff');
    expect(hsv!.h).toBeCloseTo(240, 6);
  });

  it('검정은 채도와 명도가 0입니다', () => {
    const hsv = hexToHsv('#000000');
    expect(hsv!.s).toBe(0);
    expect(hsv!.v).toBe(0);
  });

  it('흰색은 명도가 1이고 채도가 0입니다', () => {
    const hsv = hexToHsv('#ffffff');
    expect(hsv!.s).toBe(0);
    expect(hsv!.v).toBe(1);
  });

  it.each(['', '#12', '#gggggg', 'rgb(1,2,3)', '#1234567', '#12345', '   ', '#1234'])(
    '잘못된 입력 %s 은 undefined 입니다',
    (input) => {
      expect(hexToHsv(input)).toBeUndefined();
    },
  );
});

describe('hsvToHex', () => {
  it('언제나 소문자 여섯 자리 #rrggbb 형식입니다', () => {
    const samples: Hsv[] = [
      { h: 0, s: 0, v: 0 },
      { h: 200.5, s: 0.5, v: 0.5 },
      { h: 359.9, s: 1, v: 1 },
    ];
    for (const hsv of samples) {
      expect(hsvToHex(hsv)).toMatch(/^#[0-9a-f]{6}$/);
    }
  });

  it('색상각 0도와 360도는 같은 색으로 감깁니다', () => {
    expect(hsvToHex({ h: 0, s: 1, v: 1 })).toBe(hsvToHex({ h: 360, s: 1, v: 1 }));
    expect(hsvToHex({ h: 0, s: 1, v: 1 })).toBe('#ff0000');
  });
});

describe('hexToHsv 와 hsvToHex 의 왕복', () => {
  it.each(NAMED_COLORS)('%s 는 왕복 후에도 그대로입니다', (hex) => {
    const hsv = hexToHsv(hex);
    expect(hsv).toBeDefined();
    expect(hsvToHex(hsv!)).toBe(hex);
  });

  it.each(REPO_COLORS)('저장소가 실제로 쓰는 색 %s 는 왕복 후에도 그대로입니다', (hex) => {
    const hsv = hexToHsv(hex);
    expect(hsv).toBeDefined();
    expect(hsvToHex(hsv!)).toBe(hex);
  });

  it('무작위로 뽑은 색 1000개가 전부 왕복 후에도 그대로입니다', () => {
    const rand = mulberry32(20260910);
    const failures: string[] = [];
    for (let i = 0; i < 1000; i++) {
      const hex = randomHex(rand);
      const hsv = hexToHsv(hex);
      const roundTripped = hsv && hsvToHex(hsv);
      if (roundTripped !== hex) {
        failures.push(`${hex} -> ${roundTripped}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it('입력에 #이 없거나 대소문자가 섞여도 왕복 결과는 소문자 정규형입니다', () => {
    expect(hsvToHex(hexToHsv('ABCDEF')!)).toBe('#abcdef');
    expect(hsvToHex(hexToHsv('#aBc')!)).toBe('#aabbcc');
  });
});

describe('clampHsv', () => {
  it('범위 안의 값은 그대로 돌려줍니다', () => {
    expect(clampHsv({ h: 180, s: 0.5, v: 0.5 })).toEqual({ h: 180, s: 0.5, v: 0.5 });
  });

  it('채도가 1을 넘으면 1로 자릅니다', () => {
    expect(clampHsv({ h: 0, s: 1.4, v: 1 })).toEqual({ h: 0, s: 1, v: 1 });
  });

  it('채도가 음수면 0으로 자릅니다', () => {
    expect(clampHsv({ h: 0, s: -0.3, v: 1 })).toEqual({ h: 0, s: 0, v: 1 });
  });

  it('명도가 1을 넘으면 1로 자릅니다', () => {
    expect(clampHsv({ h: 0, s: 1, v: 2.1 })).toEqual({ h: 0, s: 1, v: 1 });
  });

  it('명도가 음수면 0으로 자릅니다', () => {
    expect(clampHsv({ h: 0, s: 1, v: -1 })).toEqual({ h: 0, s: 1, v: 0 });
  });

  it('색상각을 360으로 나눈 나머지로 감습니다', () => {
    expect(clampHsv({ h: 400, s: 0.5, v: 0.5 }).h).toBe(40);
    expect(clampHsv({ h: 720, s: 0.5, v: 0.5 }).h).toBe(0);
  });

  it('음수 색상각도 0 이상 360 미만으로 감습니다', () => {
    expect(clampHsv({ h: -30, s: 0.5, v: 0.5 }).h).toBe(330);
  });

  it('조인 뒤 hsvToHex 에 넘기면 채도 초과로 어긋난 색이 바로잡힙니다', () => {
    // h=30, s=1.5, v=0.5 를 그대로 넘기면 c=v*s=0.75, x=0.375, m=v-c=-0.25 가 되어
    // rgb(127.5, 31.875, -63.75) -> 반올림과 자름을 거쳐 (128, 32, 0) = #802000.
    // clampHsv 로 s 를 1로 자르면 c=0.5, x=0.25, m=0 이 되어 rgb(127.5, 63.75, 0)
    // -> (128, 64, 0) = #804000 으로, 초록 성분이 절반쯤 밝아진다.
    const distorted = hsvToHex({ h: 30, s: 1.5, v: 0.5 });
    const corrected = hsvToHex(clampHsv({ h: 30, s: 1.5, v: 0.5 }));
    expect(distorted).toBe('#802000');
    expect(corrected).toBe('#804000');
  });
});
