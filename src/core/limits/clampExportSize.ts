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

/**
 * 픽셀 수는 내림입니다. 다만 나눗셈과 곱셈을 거치면서 참값이 640 인 자리에
 * 639.9999999999999 가 나오는 일이 있고, 그대로 내림하면 사진이 1 픽셀 줄어 원본 크기로
 * 내보냈는데도 다시 표본이 잡힙니다. 정수에서 한 톨만큼 떨어진 값은 부동소수점 잡음으로
 * 보고 그 정수를 씁니다. 561.6 처럼 실제로 소수인 값은 그대로 내립니다.
 */
function toPixels(value: number): number {
  const rounded = Math.round(value);
  return Math.abs(value - rounded) < 1e-6 ? rounded : Math.floor(value);
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

  if (
    !Number.isFinite(limit.maxSide) ||
    !Number.isFinite(limit.maxArea) ||
    limit.maxSide <= 0 ||
    limit.maxArea <= 0
  ) {
    throw new Error(`이 환경에서는 캔버스를 쓸 수 없습니다: ${limit.maxSide}, ${limit.maxArea}`);
  }

  const sceneLongEdge = Math.max(sceneWidth, sceneHeight);
  const requested = targetLongEdge / sceneLongEdge;

  const sideScale = limit.maxSide / sceneLongEdge;
  const areaScale = Math.sqrt(limit.maxArea / (sceneWidth * sceneHeight));
  const scale = Math.min(requested, sideScale, areaScale);

  const width = Math.max(1, toPixels(sceneWidth * scale));
  const height = Math.max(1, toPixels(sceneHeight * scale));

  // areaScale은 제곱근으로, requested는 나눗셈으로 구해서 반올림 경로가 다릅니다.
  // 수학적으로 같은 값이어도 몇 비트 차이가 나므로 그대로 비교하면, 한계에 딱 맞는
  // 경우에 줄어들지 않았는데도 줄었다고 알리게 됩니다. 픽셀 단위로 무의미한 차이는
  // 무시합니다.
  const clamped = scale < requested * (1 - 1e-9);

  return { width, height, clamped, scale };
}
