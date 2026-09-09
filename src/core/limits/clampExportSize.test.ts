import { describe, expect, it } from 'vitest';
import { clampExportSize, type CanvasLimit } from './clampExportSize';

const ROOMY: CanvasLimit = { maxSide: 32_767, maxArea: 268_435_456 };

describe('clampExportSize', () => {
  it('긴 변을 목표에 맞추고 비율을 지킵니다', () => {
    const size = clampExportSize(1500, 1120, 3840, ROOMY);
    expect(size.width).toBe(3840);
    expect(size.height).toBe(2867);
    expect(size.clamped).toBe(false);
  });

  it('세로 사진은 세로가 긴 변입니다', () => {
    const size = clampExportSize(1000, 1620, 1920, ROOMY);
    expect(size.height).toBe(1920);
    expect(size.width).toBe(1185);
  });

  it('최대 변 길이를 넘으면 줄이고 표시합니다', () => {
    const tight: CanvasLimit = { maxSide: 4096, maxArea: 268_435_456 };
    const size = clampExportSize(1500, 1000, 8000, tight);
    expect(size.width).toBe(4096);
    expect(size.clamped).toBe(true);
  });

  it('최대 면적을 넘으면 줄이고 표시합니다', () => {
    const tight: CanvasLimit = { maxSide: 32_767, maxArea: 16_777_216 };
    const size = clampExportSize(1500, 1000, 8000, tight);
    expect(size.width * size.height).toBeLessThanOrEqual(16_777_216);
    expect(size.clamped).toBe(true);
  });

  it('한계 안에 들어오면 clamped가 false입니다', () => {
    expect(clampExportSize(1500, 1000, 1920, ROOMY).clamped).toBe(false);
  });

  it('최소 1픽셀은 보장합니다', () => {
    const size = clampExportSize(1500, 1, 10, ROOMY);
    expect(size.height).toBeGreaterThanOrEqual(1);
  });

  it('4면 여백처럼 캔버스가 커지는 경우도 같은 규칙을 씁니다', () => {
    const tight: CanvasLimit = { maxSide: 32_767, maxArea: 16_777_216 };
    const size = clampExportSize(1200, 1500, 6000, tight);
    expect(size.width * size.height).toBeLessThanOrEqual(16_777_216);
  });
});
