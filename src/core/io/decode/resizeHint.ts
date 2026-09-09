export interface ResizeHint {
  resizeWidth?: number;
  resizeHeight?: number;
  resizeQuality?: 'high';
}

/**
 * 원본 크기를 모르면 가로를 기준으로 잡습니다. 세로 사진이면 미리보기가 상한보다
 * 조금 커지지만, 원본을 통째로 디코딩하는 것보다는 훨씬 쌉니다.
 */
export function resizeHint(
  maxLongEdge: number | undefined,
  source: { width: number; height: number } | undefined,
): ResizeHint {
  if (maxLongEdge === undefined) return {};

  // NaN 은 어떤 비교에도 거짓이라 `<= 0` 만으로는 걸러지지 않습니다. 그대로
  // 통과시키면 아래 삼항이 NaN 비교의 결과로 엉뚱한 축을 고르고, 정작 긴 변은
  // 제한하지 않은 채 원본 크기로 디코딩하게 됩니다.
  const known =
    source !== undefined &&
    Number.isFinite(source.width) &&
    Number.isFinite(source.height) &&
    source.width > 0 &&
    source.height > 0;

  if (!known) {
    return { resizeWidth: maxLongEdge, resizeQuality: 'high' };
  }

  if (Math.max(source.width, source.height) <= maxLongEdge) return {};

  return source.width >= source.height
    ? { resizeWidth: maxLongEdge, resizeQuality: 'high' }
    : { resizeHeight: maxLongEdge, resizeQuality: 'high' };
}
