import { orientationTransform } from '../orientation';
import { resizeHint } from './resizeHint';

export interface DecodedImage {
  /** 이 시점에서 이미 똑바로 서 있습니다. 호출자는 회전을 다시 적용하지 않습니다. */
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export interface RasterRequest {
  file: Blob;
  autoOriented: boolean;
  orientation: number;
  /** 지정하면 긴 변이 이 값이 되도록 축소해 디코딩합니다. 미리보기용입니다. */
  maxLongEdge?: number;
  /** EXIF에 적힌 원본 크기입니다. 축소 축을 정하는 데만 씁니다. */
  sourceSize?: { width: number; height: number };
}

/**
 * 브라우저가 이미 회전을 적용했다면 그대로 씁니다. 아니라면 직접 돌립니다.
 * 회전을 두 번 적용하는 것이 이 경로에서 가장 흔한 실수입니다.
 */
export async function decodeRaster(request: RasterRequest): Promise<DecodedImage> {
  const hint = resizeHint(request.maxLongEdge, request.sourceSize);
  const bitmap = await createImageBitmap(request.file, hint);

  if (request.autoOriented || request.orientation === 1) {
    return { bitmap, width: bitmap.width, height: bitmap.height };
  }

  const oriented = orientationTransform(request.orientation, bitmap.width, bitmap.height);
  try {
    const canvas = new OffscreenCanvas(oriented.width, oriented.height);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('회전용 2D 컨텍스트를 만들지 못했습니다');
    ctx.setTransform(...oriented.matrix);
    ctx.drawImage(bitmap, 0, 0);

    const rotated = canvas.transferToImageBitmap();
    return { bitmap: rotated, width: rotated.width, height: rotated.height };
  } finally {
    // 중간에 예외가 나도 원본 비트맵은 반납해야 합니다. 큰 사진에서는
    // 이 한 장이 수백 메가바이트입니다.
    bitmap.close();
  }
}
