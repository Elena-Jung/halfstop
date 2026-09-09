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

  if (!source || source.width <= 0 || source.height <= 0) {
    return { resizeWidth: maxLongEdge, resizeQuality: 'high' };
  }

  if (Math.max(source.width, source.height) <= maxLongEdge) return {};

  return source.width >= source.height
    ? { resizeWidth: maxLongEdge, resizeQuality: 'high' }
    : { resizeHeight: maxLongEdge, resizeQuality: 'high' };
}
