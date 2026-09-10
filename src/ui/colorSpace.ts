/**
 * 16진수 색과 HSV 사이의 순수 변환 함수입니다. 색 고르기 창이 색상 원판과 채도·명도
 * 판을 그리려면 HSV 가 필요하고, 저장하고 캔버스에 넘기는 값은 `#rrggbb` 입니다. 화면
 * 코드나 DOM 참조 없이 값 변환만 담습니다.
 */

export interface Hsv {
  /** 0 이상 360 미만인 색상각입니다. */
  h: number;
  /** 0 이상 1 이하인 채도입니다. */
  s: number;
  /** 0 이상 1 이하인 명도입니다. */
  v: number;
}

const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * 사용자가 입력칸에 직접 치는 값을 파싱합니다. `#` 유무, 세 자리 축약과 여섯 자리,
 * 대소문자를 가리지 않습니다. 형식이 맞지 않으면 예외 대신 undefined 를 돌려줍니다.
 * 화면이 입력 중간 상태를 계속 이 함수로 파싱하게 됩니다.
 */
export function hexToHsv(input: string): Hsv | undefined {
  const match = HEX_PATTERN.exec(input.trim());
  if (!match) return undefined;

  const digits = match[1]!;
  const full =
    digits.length === 3
      ? digits
          .split('')
          .map((c) => c + c)
          .join('')
      : digits;

  const r = Number.parseInt(full.slice(0, 2), 16);
  const g = Number.parseInt(full.slice(2, 4), 16);
  const b = Number.parseInt(full.slice(4, 6), 16);
  return rgbToHsv(r, g, b);
}

function rgbToHsv(r: number, g: number, b: number): Hsv {
  const rN = r / 255;
  const gN = g / 255;
  const bN = b / 255;
  const max = Math.max(rN, gN, bN);
  const min = Math.min(rN, gN, bN);
  const delta = max - min;

  let h = 0;
  if (delta !== 0) {
    if (max === rN) {
      h = 60 * (((gN - bN) / delta) % 6);
    } else if (max === gN) {
      h = 60 * ((bN - rN) / delta + 2);
    } else {
      h = 60 * ((rN - gN) / delta + 4);
    }
    if (h < 0) h += 360;
  }

  const s = max === 0 ? 0 : delta / max;
  const v = max;

  return { h, s, v };
}

/**
 * 캔버스와 옵션 저장에 넘기는 값은 언제나 소문자 여섯 자리 `#rrggbb` 입니다.
 * `src/ui/theme.test.ts` 와 옵션의 `color` 값이 이 형식만 받습니다.
 */
export function hsvToHex(hsv: Hsv): string {
  // 색상각은 원판을 한 바퀴 도는 값이라 360도를 0도로 감습니다.
  const h = ((hsv.h % 360) + 360) % 360;
  const s = hsv.s;
  const v = hsv.v;

  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;

  let r1: number, g1: number, b1: number;
  if (h < 60) {
    [r1, g1, b1] = [c, x, 0];
  } else if (h < 120) {
    [r1, g1, b1] = [x, c, 0];
  } else if (h < 180) {
    [r1, g1, b1] = [0, c, x];
  } else if (h < 240) {
    [r1, g1, b1] = [0, x, c];
  } else if (h < 300) {
    [r1, g1, b1] = [x, 0, c];
  } else {
    [r1, g1, b1] = [c, 0, x];
  }

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}`;
}

function toHexByte(n: number): string {
  const clamped = Math.max(0, Math.min(255, n));
  return clamped.toString(16).padStart(2, '0');
}

/**
 * `hsvToHex` 를 부르기 전에 범위를 벗어난 값을 조입니다. `hsvToHex` 자체는 채도와
 * 명도가 0과 1 사이를 벗어나도 막지 않고, 형식은 `#rrggbb` 로 지키면서 색만 어긋나게
 * 그립니다. 색상각은 원판을 도는 값이라 감고, 채도와 명도는 0과 1 사이로 자릅니다.
 * 색 고르기 창에서 판이나 슬라이더가 만든 값을 `hsvToHex` 에 넘기기 전에 반드시
 * 이 함수를 거칩니다.
 */
export function clampHsv(hsv: Hsv): Hsv {
  const h = ((hsv.h % 360) + 360) % 360;
  const s = Math.min(1, Math.max(0, hsv.s));
  const v = Math.min(1, Math.max(0, hsv.v));
  return { h, s, v };
}
