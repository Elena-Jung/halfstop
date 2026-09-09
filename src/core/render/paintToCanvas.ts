import type { Scene } from '../layout/types';
import { clampExportSize, type CanvasLimit } from '../limits/clampExportSize';
import { paint } from '../paint/paint';

export type AnyCanvas = HTMLCanvasElement | OffscreenCanvas;

export interface PaintToCanvasRequest {
  scene: Scene;
  canvas: AnyCanvas;
  photo: CanvasImageSource;
  logo: (logoId: string) => Path2D | null;
  targetLongEdge: number;
  limit: CanvasLimit;
}

/**
 * 캔버스 크기를 정하고 Scene을 그립니다. 미리보기와 내보내기가 함께 씁니다.
 * 두 경로의 차이는 targetLongEdge와 넘기는 비트맵뿐입니다.
 */
export function paintToCanvas(request: PaintToCanvasRequest): {
  width: number;
  height: number;
  clamped: boolean;
} {
  const { scene, canvas } = request;
  const size = clampExportSize(scene.width, scene.height, request.targetLongEdge, request.limit);

  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d') as
    | CanvasRenderingContext2D
    | OffscreenCanvasRenderingContext2D
    | null;
  if (!ctx) throw new Error('2D 컨텍스트를 만들지 못했습니다');

  ctx.imageSmoothingQuality = 'high';
  // Scene 전체의 긴 변을 기준으로 배율을 정해야 프레임까지 목표 크기 안에 들어옵니다.
  paint(scene, ctx, size.width / scene.width, { photo: request.photo, logo: request.logo });

  return size;
}
