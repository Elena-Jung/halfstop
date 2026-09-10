/**
 * WCAG 2.2 의 상대 휘도와 명암비입니다. 눈으로 보는 대신 숫자로 확인하기 위한 것입니다.
 * 색은 `#rrggbb` 형식만 받습니다. 화면에 쓰는 색을 그 형식으로 통일해 두었습니다.
 */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`색 형식이 올바르지 않습니다: ${hex}`);
  const n = Number.parseInt(match[1]!, 16);
  const r = channel((n >> 16) & 0xff);
  const g = channel((n >> 8) & 0xff);
  const b = channel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
