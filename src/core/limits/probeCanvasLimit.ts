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
 * 여기까지만 잽니다. 내보내기가 실제로 쓰는 가장 큰 값은 4K 프리셋(3840)에
 * 프레임을 더한 정도이고, 원본 내보내기도 이 선에서 잘리면 사용자에게 알립니다.
 * 그보다 큰 한계를 알아내려면 기가바이트급 캔버스를 할당해 봐야 하는데,
 * 그 시도 자체가 이 함수가 막으려는 문제를 일으킵니다.
 */
const PROBE_CEILING = 8192;

/** 작은 것부터 확인해, 실패하기 직전 크기까지만 할당해 봅니다. */
const PROBE_STEPS = [1024, 2048, 4096, PROBE_CEILING] as const;

/**
 * 큰 할당을 여러 번 하므로 느립니다. 호출자가 결과를 캐시해야 합니다.
 *
 * 아래에서 위로 올라갑니다. 위에서 내려오는 이분 탐색은 첫 시도가 가장 커서,
 * 메모리가 빠듯한 기기에서 측정 자체가 탭을 무너뜨릴 수 있습니다.
 *
 * 반환하는 `maxSide` 는 항상 실제로 할당에 성공한 값이며, 0이면 이 환경에서는
 * 캔버스를 쓸 수 없다는 뜻입니다.
 */
export function probeCanvasLimit(): CanvasLimit {
  let low = 0;
  for (const side of PROBE_STEPS) {
    if (!canAllocate(side)) break;
    low = side;
  }
  return { maxSide: low, maxArea: low * low };
}
