/**
 * 글자는 중심선을 기준으로 위아래로 크기의 이 비율만큼 뻗습니다. baseline 이 'middle' 이라
 * 정확한 값은 서체마다 다르지만, 배치 계산에는 이 한 가지 비율로 통일해 씁니다. 이 관례가
 * 여러 곳에 숫자로 흩어져 있으면 한쪽만 고쳐져 계수가 어긋납니다.
 */
export const HALF_HEIGHT_RATIO = 0.62;

/** 중심선 기준 글자의 반높이입니다. */
export function halfHeight(size: number): number {
  return size * HALF_HEIGHT_RATIO;
}

/**
 * 두 줄을 위아래로 나란히 담는 데 드는 높이입니다. 큰 쪽 글자의 반높이 두 개입니다.
 * 남은 높이에서 이 값을 빼면 두 줄 사이에 벌릴 수 있는 최대 간격이 나옵니다.
 */
export function twoLineHeight(sizeA: number, sizeB: number): number {
  return halfHeight(Math.max(sizeA, sizeB)) * 2;
}

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
