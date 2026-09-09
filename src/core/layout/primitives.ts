import type { LayoutServices, TextStyle } from './types';

const ELLIPSIS = '…';

export function ellipsize(
  text: string,
  maxWidth: number,
  style: TextStyle,
  services: LayoutServices,
): string {
  if (text === '' || maxWidth <= 0) return '';
  if (services.measureText(text, style) <= maxWidth) return text;

  const ellipsisWidth = services.measureText(ELLIPSIS, style);
  if (ellipsisWidth > maxWidth) return '';

  const budget = maxWidth - ellipsisWidth;
  const chars = [...text];
  let kept = '';

  for (const char of chars) {
    const candidate = kept + char;
    if (services.measureText(candidate, style) > budget) break;
    kept = candidate;
  }

  // 말줄임표가 들어가는지는 위에서 이미 판단했습니다. 여기서 kept가 비었다고
  // 다시 빈 문자열로 떨어뜨리면, 폭은 되는데 글자만 안 들어가는 경우에
  // 잘렸다는 표시조차 사라집니다.
  return kept + ELLIPSIS;
}
