import { describe, expect, it } from 'vitest';
import { paintToCanvas, type AnyCanvas } from './paintToCanvas';
import type { Scene } from '../layout/types';
import type { CanvasLimit } from '../limits/clampExportSize';

const ROOMY: CanvasLimit = { maxSide: 32_767, maxArea: 268_435_456 };

function scene(width: number, height: number): Scene {
  return { width, height, background: '#ffffff', nodes: [] };
}

/**
 * paint.test.ts 가 쓰는 기록용 컨텍스트와 같은 방식입니다. 실제 OffscreenCanvas를
 * 만들지 않고, width/height를 직접 받는 자리표시 캔버스로 충분합니다.
 */
function fakeCanvas(): { canvas: AnyCanvas; scaleCalls: number[] } {
  const scaleCalls: number[] = [];
  const ctx = {
    save: () => {},
    restore: () => {},
    scale: (x: number) => {
      scaleCalls.push(x);
    },
    translate: () => {},
    fillRect: () => {},
    fillText: () => {},
    drawImage: () => {},
    fill: () => {},
    set fillStyle(_: string) {},
    set font(_: string) {},
    set textAlign(_: string) {},
    set textBaseline(_: string) {},
    set globalAlpha(_: number) {},
    set imageSmoothingQuality(_: string) {},
  };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  return { canvas: canvas as unknown as AnyCanvas, scaleCalls };
}

const sources = { photo: {} as CanvasImageSource, logo: () => null };

describe('paintToCanvas', () => {
  it('세로가 긴 장면에서 캔버스 크기와 paint에 넘어간 배율이 서로 맞습니다', () => {
    // sceneWidth에 소수부를 두어 floor 반올림이 실제로 일어나게 합니다. size.width로
    // 배율을 되계산하는 구현이라면, 그 배율을 sceneHeight에 곱한 값이 캔버스 높이와
    // 1픽셀 넘게 어긋납니다.
    const tall = scene(600.495, 900);
    const { canvas, scaleCalls } = fakeCanvas();
    const result = paintToCanvas({
      scene: tall,
      canvas,
      ...sources,
      targetLongEdge: 1800,
      limit: ROOMY,
    });
    const usedScale = scaleCalls[0]!;
    expect(Math.abs(usedScale * tall.width - canvas.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(usedScale * tall.height - canvas.height)).toBeLessThanOrEqual(1);
    expect(result.clamped).toBe(false);
  });

  it('가로가 긴 장면에서도 같은 성질이 성립합니다', () => {
    const wide = scene(900, 600.495);
    const { canvas, scaleCalls } = fakeCanvas();
    const result = paintToCanvas({
      scene: wide,
      canvas,
      ...sources,
      targetLongEdge: 1800,
      limit: ROOMY,
    });
    const usedScale = scaleCalls[0]!;
    expect(Math.abs(usedScale * wide.width - canvas.width)).toBeLessThanOrEqual(1);
    expect(Math.abs(usedScale * wide.height - canvas.height)).toBeLessThanOrEqual(1);
    expect(result.clamped).toBe(false);
  });

  it('한계에 걸려 줄어들 때 clamped가 true이고 캔버스가 한계 안에 들어옵니다', () => {
    const big = scene(1500, 1000);
    const tight: CanvasLimit = { maxSide: 4096, maxArea: 268_435_456 };
    const { canvas } = fakeCanvas();
    const result = paintToCanvas({
      scene: big,
      canvas,
      ...sources,
      targetLongEdge: 8000,
      limit: tight,
    });
    expect(result.clamped).toBe(true);
    expect(canvas.width).toBeLessThanOrEqual(4096);
    expect(canvas.height).toBeLessThanOrEqual(4096);
  });
});
