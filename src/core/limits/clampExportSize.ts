export interface CanvasLimit {
  /** 한 변의 최대 픽셀 수입니다. */
  maxSide: number;
  /** 가로 곱하기 세로의 최대 픽셀 수입니다. */
  maxArea: number;
}

export interface ExportSize {
  width: number;
  height: number;
  /** 기기 한계 때문에 요청보다 작아졌으면 true입니다. 화면에 알려야 합니다. */
  clamped: boolean;
  /**
   * width와 height를 만든 배율입니다. 두 변을 각각 내림하므로
   * `width / sceneWidth` 로 되계산하면 값이 어긋납니다. 세로가 긴 장면에서는
   * 그 차이가 캔버스 아래쪽의 안 칠해진 띠로 나타납니다.
   */
  scale: number;
}

export function clampExportSize(
  sceneWidth: number,
  sceneHeight: number,
  targetLongEdge: number,
  limit: CanvasLimit,
): ExportSize {
  if (
    !Number.isFinite(sceneWidth) ||
    !Number.isFinite(sceneHeight) ||
    sceneWidth <= 0 ||
    sceneHeight <= 0 ||
    !Number.isFinite(targetLongEdge) ||
    targetLongEdge <= 0
  ) {
    throw new Error(`내보내기 크기가 올바르지 않습니다: ${sceneWidth}x${sceneHeight} -> ${targetLongEdge}`);
  }

  const sceneLongEdge = Math.max(sceneWidth, sceneHeight);
  const requested = targetLongEdge / sceneLongEdge;

  const sideScale = limit.maxSide / sceneLongEdge;
  const areaScale = Math.sqrt(limit.maxArea / (sceneWidth * sceneHeight));
  const scale = Math.min(requested, sideScale, areaScale);

  const width = Math.max(1, Math.floor(sceneWidth * scale));
  const height = Math.max(1, Math.floor(sceneHeight * scale));

  // areaScale은 제곱근으로, requested는 나눗셈으로 구해서 반올림 경로가 다릅니다.
  // 수학적으로 같은 값이어도 몇 비트 차이가 나므로 그대로 비교하면, 한계에 딱 맞는
  // 경우에 줄어들지 않았는데도 줄었다고 알리게 됩니다. 픽셀 단위로 무의미한 차이는
  // 무시합니다.
  const clamped = scale < requested * (1 - 1e-9);

  return { width, height, clamped, scale };
}
