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

  // 응답을 구조화 복제로 옮길 수 없으면 message 도 error 도 오지 않아 기다리던
  // 프라미스가 정착하지 않습니다. 이 핸들러가 없으면 busy 가 영구히 잠깁니다.
  worker.addEventListener('messageerror', () => {
    for (const [id, settle] of pending) {
      settle({ id, ok: false, message: '워커 응답을 읽지 못했습니다' });
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
      // 그냥 비우면 기다리던 프라미스가 영원히 미결로 남습니다. 화면을 떠나면서
      // 정리할 때 흔히 밟는 경로입니다.
      for (const [id, settle] of pending) {
        settle({ id, ok: false, message: '워커를 정리했습니다' });
      }
      pending.clear();
    },
  };
}
