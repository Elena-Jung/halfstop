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
 * 'original'은 사진의 원래 픽셀 크기를 기준으로 삼습니다. 프레임이 붙으면
 * 캔버스는 그보다 커지므로, 최종 크기는 clampExportSize가 다시 정합니다.
 */
export function targetLongEdge(preset: ExportPreset, photoLongEdgePx: number): number {
  return preset === 'original' ? photoLongEdgePx : EXPORT_LONG_EDGE[preset];
}
