import { fontUrl } from '../assets/fontUrls';
import { encodeCanvas } from '../core/export/encode';
import { targetLongEdge } from '../core/export/resolution';
import { decodeImage } from '../core/io/decode';
import { fontById } from '../core/paint/fontFamilies';
import { ensureCanvasFont, type FontFaceSetLike } from '../core/paint/fonts';
import { paintToCanvas } from '../core/render/paintToCanvas';
import type { RenderJob, RenderReply } from './protocol';

const NO_LOGO = () => null;

// 워커 캔버스는 문서에 로드된 폰트를 보지 못합니다. 여기서 따로 등록해야
// 미리보기와 같은 서체로 그려집니다. 서체별로 한 번만 받습니다.
const fontReady = new Map<string, Promise<void>>();
function ensureFont(id: string): Promise<void> {
  let pending = fontReady.get(id);
  if (!pending) {
    pending = ensureCanvasFont(self.fonts as unknown as FontFaceSetLike, fontById(id), fontUrl(id));
    fontReady.set(id, pending);
  }
  return pending;
}

async function run(job: RenderJob): Promise<RenderReply> {
  let bitmap: ImageBitmap | null = null;
  try {
    await ensureFont(job.fontId);

    const image = await decodeImage({
      file: job.file,
      autoOriented: job.autoOriented,
      orientation: job.orientation,
    });
    bitmap = image.bitmap;

    const canvas = new OffscreenCanvas(1, 1);
    const size = paintToCanvas({
      scene: job.scene,
      canvas,
      photo: image.bitmap,
      logo: NO_LOGO,
      targetLongEdge: targetLongEdge(job.preset, Math.max(image.width, image.height)),
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
  }
}

self.addEventListener('message', (event: MessageEvent<RenderJob>) => {
  void run(event.data).then((reply) => {
    self.postMessage(reply);
  });
});
