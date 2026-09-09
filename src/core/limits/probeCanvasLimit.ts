import type { CanvasLimit } from './clampExportSize';

/**
 * iOS Safari는 한계를 넘겨도 예외를 던지지 않고 투명한 캔버스를 돌려줍니다.
 * 그래서 크기만 확인해서는 안 되고, 픽셀을 그린 뒤 실제로 되읽어야 합니다.
 */
function canAllocate(side: number): boolean {
  try {
    const canvas = new OffscreenCanvas(side, side);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(side - 1, side - 1, 1, 1);
    const pixel = ctx.getImageData(side - 1, side - 1, 1, 1).data;
    return pixel[0] === 255 && pixel[3] === 255;
  } catch {
    return false;
  }
}

/** 큰 할당을 여러 번 하므로 느립니다. 호출자가 결과를 캐시해야 합니다. */
export function probeCanvasLimit(): CanvasLimit {
  if (!canAllocate(1024)) return { maxSide: 1024, maxArea: 1024 * 1024 };

  let low = 1024;
  let high = 32_768;
  while (high - low > 256) {
    const mid = Math.floor((low + high) / 2);
    if (canAllocate(mid)) low = mid;
    else high = mid;
  }
  return { maxSide: low, maxArea: low * low };
}
