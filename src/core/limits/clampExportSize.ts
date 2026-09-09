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
}

export function clampExportSize(
  sceneWidth: number,
  sceneHeight: number,
  targetLongEdge: number,
  limit: CanvasLimit,
): ExportSize {
  const sceneLongEdge = Math.max(sceneWidth, sceneHeight);
  const requested = targetLongEdge / sceneLongEdge;

  let scale = requested;
  scale = Math.min(scale, limit.maxSide / sceneLongEdge);
  const areaScale = Math.sqrt(limit.maxArea / (sceneWidth * sceneHeight));
  scale = Math.min(scale, areaScale);

  const width = Math.max(1, Math.floor(sceneWidth * scale));
  const height = Math.max(1, Math.floor(sceneHeight * scale));

  return { width, height, clamped: scale < requested };
}
