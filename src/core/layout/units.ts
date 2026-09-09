/**
 * 사진의 짧은 변이 항상 이 값이 되도록 좌표계를 정합니다.
 * 프리셋 옵션을 절대 픽셀로 두면 1200만 화소 사진과 4500만 화소 사진에서
 * 같은 설정이 다른 결과를 냅니다. 이 정규화가 그 문제를 없앱니다.
 */
export const UNITS_PER_SHORT_EDGE = 1000;

export interface UnitSize {
  width: number;
  height: number;
}

export function toUnits(pixelWidth: number, pixelHeight: number): UnitSize {
  if (
    !Number.isFinite(pixelWidth) ||
    !Number.isFinite(pixelHeight) ||
    pixelWidth <= 0 ||
    pixelHeight <= 0
  ) {
    throw new Error(`사진 크기가 올바르지 않습니다: ${pixelWidth}x${pixelHeight}`);
  }
  const short = Math.min(pixelWidth, pixelHeight);
  return {
    width: (pixelWidth * UNITS_PER_SHORT_EDGE) / short,
    height: (pixelHeight * UNITS_PER_SHORT_EDGE) / short,
  };
}
