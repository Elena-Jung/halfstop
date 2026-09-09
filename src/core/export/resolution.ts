import { UNITS_PER_SHORT_EDGE } from '../layout/units';

export type ExportPreset = 'original' | '4k' | '2k' | 'sns';

export const EXPORT_LONG_EDGE: Record<Exclude<ExportPreset, 'original'>, number> = {
  '4k': 3840,
  '2k': 1920,
  sns: 1080,
};

/**
 * 미리보기 캔버스의 긴 변입니다. 옵션을 만질 때마다 다시 그리는 경로이므로
 * 화면에서 판단이 가능한 선에서 가장 작게 잡습니다.
 */
export const PREVIEW_LONG_EDGE = 1600;

/**
 * '원본'은 사진이 원래 픽셀 크기로 그려진다는 뜻입니다. 프레임이 붙어 캔버스가
 * 커지는 만큼 결과물도 커집니다.
 *
 * 장면의 긴 변을 사진의 긴 변에 맞추면 안 됩니다. 그렇게 하면 프레임을 두껍게
 * 할수록 사진이 작아져, 고른 것과 정반대의 결과가 나옵니다. 600x900 사진에
 * 하단 바를 붙이면 555x900이 나오는 식입니다.
 *
 * 짧은 변이 항상 1000 단위이므로, 사진의 짧은 변 픽셀 수를 1000으로 나누면
 * 원본 크기로 그리는 배율이 나옵니다.
 */
export function targetLongEdge(
  preset: ExportPreset,
  scene: { width: number; height: number },
  photoPx: { width: number; height: number },
): number {
  if (preset !== 'original') return EXPORT_LONG_EDGE[preset];
  const pxPerUnit = Math.min(photoPx.width, photoPx.height) / UNITS_PER_SHORT_EDGE;
  return Math.max(scene.width, scene.height) * pxPerUnit;
}
