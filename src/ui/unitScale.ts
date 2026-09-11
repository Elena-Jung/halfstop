import { targetLongEdge, type ExportPreset } from '../core/export/resolution';

/**
 * 숫자 칸이 값을 보여 주고 받는 단위입니다. **저장되는 값은 언제나 디자인 단위(u)이고
 * px 는 겉면일 뿐입니다.** 단위 자체를 px 로 저장하면 6000픽셀 사진과 3000픽셀 사진에서
 * 같은 설정이 다른 결과를 냅니다. 이 앱이 처음부터 피하려던 문제입니다.
 */
export type UnitMode = 'u' | 'px';

/**
 * 1u 가 내보낼 파일에서 몇 픽셀이 되는지입니다.
 *
 * 사용자가 궁금한 숫자는 "지금 보고 있는 사진을 지금 고른 크기로 내려받았을 때의 픽셀"
 * 이므로 내보내기 크기를 함께 봅니다. 크기를 2K 로 바꾸면 같은 u 가 더 작은 px 이 됩니다.
 *
 * 사진의 원본 픽셀 크기를 모르면(EXIF 가 없는 파일) null 입니다. 부르는 쪽은 그때 px
 * 단추를 내보내지 않습니다. 환산할 수 없는데 단추만 있으면 눌렀을 때 엉뚱한 숫자가
 * 나옵니다.
 */
export function pxPerUnitFor(
  size: ExportPreset,
  scene: { width: number; height: number } | null,
  photoPx: { width: number; height: number } | undefined,
): number | null {
  if (scene === null || photoPx === undefined) return null;
  const longEdgeUnits = Math.max(scene.width, scene.height);
  if (longEdgeUnits <= 0) return null;
  const longEdgePx = targetLongEdge(size, scene, photoPx);
  if (!Number.isFinite(longEdgePx) || longEdgePx <= 0) return null;
  return longEdgePx / longEdgeUnits;
}

/** 화면에 보일 값입니다. px 는 정수로 반올림합니다. 소수점 픽셀은 읽을 이유가 없습니다. */
export function displayValue(units: number, mode: UnitMode, pxPerUnit: number | null): number {
  if (mode === 'u' || pxPerUnit === null) return units;
  return Math.round(units * pxPerUnit);
}

/**
 * 화면에서 받은 값을 저장할 u 로 되돌립니다.
 *
 * **소수점 둘째 자리에서 끊습니다.** 반올림하지 않으면 `102.09600000000001` 같은 값이
 * 저장되고 u 로 돌아왔을 때 화면이 지저분해집니다. 왕복이 값을 조금 잃는 것은 받아들이되
 * (102u 를 px 로 보고 다시 u 로 오면 101.99u 가 될 수 있습니다), 모드만 오갈 때는
 * 저장값을 건드리지 않으므로 사용자가 손대지 않은 값은 그대로입니다.
 */
export function storedValue(shown: number, mode: UnitMode, pxPerUnit: number | null): number {
  if (mode === 'u' || pxPerUnit === null) return shown;
  return Math.round((shown / pxPerUnit) * 100) / 100;
}

/**
 * 옵션 선언의 최소와 최대도 u 기준이라 함께 환산합니다. 최소는 올리고 최대는 내려, 되돌린
 * 값이 선언 범위를 벗어나지 않게 합니다.
 */
export function displayBounds(
  min: number,
  max: number,
  mode: UnitMode,
  pxPerUnit: number | null,
): { min: number; max: number } {
  if (mode === 'u' || pxPerUnit === null) return { min, max };
  return { min: Math.ceil(min * pxPerUnit), max: Math.floor(max * pxPerUnit) };
}

/**
 * 증감 폭입니다. 1u 가 보통 3에서 5픽셀이라 px 모드에서 그대로 두면 너무 성큼 뜁니다.
 */
export function displayStep(step: number, mode: UnitMode): number {
  return mode === 'u' ? step : 1;
}
