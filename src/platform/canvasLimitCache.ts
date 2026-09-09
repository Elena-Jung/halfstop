import type { CanvasLimit } from '../core/limits/clampExportSize';
import { probeCanvasLimit } from '../core/limits/probeCanvasLimit';

const CACHE_KEY = 'halfstop.canvasLimit.v1';

function read(): CanvasLimit | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CanvasLimit).maxSide === 'number' &&
      typeof (parsed as CanvasLimit).maxArea === 'number'
    ) {
      return parsed as CanvasLimit;
    }
    return null;
  } catch {
    return null;
  }
}

export function cachedCanvasLimit(): CanvasLimit {
  const cached = read();
  if (cached) return cached;

  const limit = probeCanvasLimit();
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(limit));
  } catch {
    // 사생활 보호 모드에서는 저장이 막힙니다. 측정값은 그대로 쓰면 됩니다.
  }
  return limit;
}
