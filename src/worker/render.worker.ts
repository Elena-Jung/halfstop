import { fontUrl } from '../assets/fontUrls';
import { encodeCanvas } from '../core/export/encode';
import { targetLongEdge } from '../core/export/resolution';
import { decodeImage } from '../core/io/decode';
import { fontById } from '../core/paint/fontFamilies';
import { ensureCanvasFontOnce, type FontFaceSetLike } from '../core/paint/fonts';
import { paintToCanvas } from '../core/render/paintToCanvas';
import { ensureSceneLogos, logoImage } from '../images/logoImages';
import type { RenderJob, RenderReply } from './protocol';

async function run(job: RenderJob): Promise<RenderReply> {
  let bitmap: ImageBitmap | null = null;
  let canvas: OffscreenCanvas | null = null;
  try {
    // 워커 캔버스는 문서에 로드된 폰트를 보지 못합니다. 여기서 따로 등록해야
    // 미리보기와 같은 서체로 그려집니다. 진행 중인 등록과 실패 재시도는
    // ensureCanvasFontOnce가 이미 처리합니다.
    await ensureCanvasFontOnce(
      self.fonts as unknown as FontFaceSetLike,
      fontById(job.fontId),
      fontUrl(job.fontId),
    );

    // paintToCanvas 는 동기 함수라 그리기 전에 로고 그림이 손에 있어야 합니다. 여기서
    // 기다리지 않으면 미리보기에는 있는 로고가 받은 파일에서만 빠집니다. 서체를 미리
    // 등록하는 바로 위 줄과 같은 이유이고 같은 자리입니다.
    await ensureSceneLogos(job.scene);

    const image = await decodeImage({
      file: job.file,
      autoOriented: job.autoOriented,
      orientation: job.orientation,
    });
    bitmap = image.bitmap;

    canvas = new OffscreenCanvas(1, 1);
    const size = paintToCanvas({
      scene: job.scene,
      canvas,
      photo: image.bitmap,
      logo: logoImage,
      targetLongEdge: targetLongEdge(job.size, job.scene, {
        width: image.width,
        height: image.height,
      }),
      limit: job.limit,
    });

    const blob = await encodeCanvas(canvas, job.format, job.quality);
    return { id: job.id, ok: true, blob, ...size };
  } catch (error) {
    return {
      id: job.id,
      ok: false,
      message: error instanceof Error ? error.message : '렌더에 실패했습니다',
    };
  } finally {
    bitmap?.close();
    // 전체 해상도 캔버스는 수백 메가바이트일 수 있습니다. 연달아 내보낼 때
    // 이전 것이 수거를 기다리며 남지 않도록 즉시 반납합니다.
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

self.addEventListener('message', (event: MessageEvent<RenderJob>) => {
  void run(event.data).then((reply) => {
    self.postMessage(reply);
  });
});
