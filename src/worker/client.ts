import { isRenderReply, nextJobId, type RenderJob, type RenderReply } from './protocol';

export interface RenderOutcome {
  blob: Blob;
  width: number;
  height: number;
  clamped: boolean;
}

export interface RenderClient {
  render(job: Omit<RenderJob, 'id'>): Promise<RenderOutcome>;
  dispose(): void;
}

export function createRenderClient(): RenderClient {
  const worker = new Worker(new URL('./render.worker.ts', import.meta.url), { type: 'module' });
  const pending = new Map<number, (reply: RenderReply) => void>();

  worker.addEventListener('message', (event: MessageEvent<unknown>) => {
    if (!isRenderReply(event.data)) return;
    const settle = pending.get(event.data.id);
    if (!settle) return;
    pending.delete(event.data.id);
    settle(event.data);
  });

  // 워커 안에서 잡히지 않은 오류가 나면 기다리던 요청이 영원히 매달립니다.
  worker.addEventListener('error', (event) => {
    for (const [id, settle] of pending) {
      settle({ id, ok: false, message: event.message || '워커에서 오류가 났습니다' });
    }
    pending.clear();
  });

  return {
    render(job) {
      const id = nextJobId();
      return new Promise<RenderOutcome>((resolve, reject) => {
        pending.set(id, (reply) => {
          if (reply.ok) {
            resolve({
              blob: reply.blob,
              width: reply.width,
              height: reply.height,
              clamped: reply.clamped,
            });
          } else {
            reject(new Error(reply.message));
          }
        });
        worker.postMessage({ ...job, id } satisfies RenderJob);
      });
    },
    dispose() {
      worker.terminate();
      pending.clear();
    },
  };
}
