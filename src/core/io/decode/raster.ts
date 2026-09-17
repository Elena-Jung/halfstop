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

  // 열 수 없는 파일에서 브라우저가 던지는 오류를 우리 문구로 바꿔 다시 던집니다.
  // createImageBitmap 은 내용이 깨졌든 잘렸든 비었든 한결같이
  // `InvalidStateError: The source image could not be decoded.` 를 냅니다. 그 영어
  // 문구는 화면 쪽 규칙표(src/ui/errorMessage.ts)가 모르는 말이라 "알 수 없는 문제가
  // 생겼습니다" 로 떨어졌고, 사용자는 무엇을 해야 할지 알 수 없었습니다.
  //
  // 규칙표를 늘리지 않고 여기서 바꾸는 이유가 있습니다. 그 표는 우리가 던지는 말을
  // 보도록 설계되어 있고, 브라우저 문구는 판마다 달라 표에 적어 두면 어느 브라우저에서
  // 조용히 어긋납니다. 원래 오류는 cause 로 달아 두어 개발자가 잃지 않습니다.
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(request.file, hint);
  } catch (cause) {
    throw new Error('사진을 디코딩하지 못했습니다', { cause });
  }

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
    // transferToImageBitmap 뒤에도 원본 해상도 크기의 빈 백킹 스토어가 캔버스에 남습니다.
    // probeCanvasLimit.ts, render.worker.ts 와 같은 이유로 크기를 0으로 되돌려 반납합니다.
    canvas.width = 0;
    canvas.height = 0;
    return { bitmap: rotated, width: rotated.width, height: rotated.height };
  } finally {
    // 중간에 예외가 나도 원본 비트맵은 반납해야 합니다. 큰 사진에서는
    // 이 한 장이 수백 메가바이트입니다.
    bitmap.close();
  }
}
