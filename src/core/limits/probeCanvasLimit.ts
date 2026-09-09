import type { CanvasLimit } from './clampExportSize';

/**
 * iOS Safari는 한계를 넘겨도 예외를 던지지 않고 투명한 캔버스를 돌려줍니다.
 * 그래서 크기만 확인해서는 안 되고, 픽셀을 그린 뒤 실제로 되읽어야 합니다.
 */
function canAllocate(side: number): boolean {
  let canvas: OffscreenCanvas | null = null;
  try {
    canvas = new OffscreenCanvas(side, side);
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(side - 1, side - 1, 1, 1);
    const pixel = ctx.getImageData(side - 1, side - 1, 1, 1).data;
    return pixel[0] === 255 && pixel[3] === 255;
  } catch {
    return false;
  } finally {
    // 이분 탐색이 큰 캔버스를 십여 번 만듭니다. 참조만 버리면 수거가 늦어,
    // 메모리 압박을 재려는 함수가 스스로 압박을 만들게 됩니다. 크기를 0으로
    // 되돌리면 백킹 스토어가 즉시 반납됩니다.
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

/**
 * 큰 할당을 여러 번 하므로 느립니다. 호출자가 결과를 캐시해야 합니다.
 *
 * `low` 는 0에서 시작합니다. 확인되지 않은 값을 한계로 내놓지 않기 위해서입니다.
 * 반환하는 `maxSide` 는 항상 실제로 할당에 성공한 값이며, 0이면 이 환경에서는
 * 캔버스를 쓸 수 없다는 뜻입니다.
 *
 * 상한 32768 은 탐색 범위를 자르는 값이지 측정한 값이 아닙니다. 그보다 큰 캔버스를
 * 허용하는 기기에서는 실제 한계보다 작게 보고합니다.
 */
export function probeCanvasLimit(): CanvasLimit {
  let low = 0;
  let high = 32_768;
  while (high - low > 256) {
    const mid = Math.floor((low + high) / 2);
    if (canAllocate(mid)) low = mid;
    else high = mid;
  }
  return { maxSide: low, maxArea: low * low };
}
