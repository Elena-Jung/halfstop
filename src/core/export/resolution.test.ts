import { describe, expect, it } from 'vitest';
import { clampExportSize, type CanvasLimit } from '../limits/clampExportSize';
import { targetLongEdge } from './resolution';

const ROOMY: CanvasLimit = { maxSide: 32_767, maxArea: 268_435_456 };

describe('targetLongEdge', () => {
  it('세로 사진 재현 사례: 600x900 사진에 하단 바가 붙어도 사진 영역이 원본을 유지합니다', () => {
    // 사진 600x900 -> toUnits로 짧은 변 1000 정규화 -> 1000x1500.
    // infoBar가 바 높이 120을 더해 장면은 1000x1620.
    // 짧은 변 기준 배율은 600 / 1000 = 0.6 이고, 이 배율로 장면의 긴 변(1620)을
    // 그리면 1620 * 0.6 = 972 가 targetLongEdge입니다.
    const scene = { width: 1000, height: 1620 };
    const photoPx = { width: 600, height: 900 };

    const target = targetLongEdge('original', scene, photoPx);
    expect(target).toBe(972);

    // 이 값을 clampExportSize에 그대로 넣으면, 배율 0.6이 그대로 적용되어
    // 너비는 1000 * 0.6 = 600, 높이는 1620 * 0.6 = 972 가 됩니다.
    // 972 중 사진이 차지하는 부분은 1500 * 0.6 = 900 이므로, 사진 영역은
    // 600x900으로 원본 픽셀 크기를 그대로 유지합니다.
    const size = clampExportSize(scene.width, scene.height, target, ROOMY);
    expect(size.width).toBe(600);
    expect(size.height).toBe(972);
  });

  it('가로 사진에서도 같은 성질이 성립합니다', () => {
    // 900x600 사진 -> 짧은 변 정규화로 1500x1000. 우측에 바가 붙어 장면은
    // 1620x1000. 배율은 600 / 1000 = 0.6, 긴 변(1620) 기준 결과는 972.
    const scene = { width: 1620, height: 1000 };
    const photoPx = { width: 900, height: 600 };

    const target = targetLongEdge('original', scene, photoPx);
    expect(target).toBe(972);

    const size = clampExportSize(scene.width, scene.height, target, ROOMY);
    expect(size.height).toBe(600);
    expect(size.width).toBe(972);
  });

  it('프레임이 두꺼워질수록 결과가 작아지지 않고 커집니다', () => {
    const photoPx = { width: 600, height: 900 };

    const thin = targetLongEdge('original', { width: 1000, height: 1620 }, photoPx);
    const thick = targetLongEdge('original', { width: 1000, height: 2000 }, photoPx);

    expect(thick).toBeGreaterThan(thin);
  });

  it("'4k', '2k', 'sns'는 장면과 사진 크기를 무시하고 고정 값을 돌려줍니다", () => {
    const scene = { width: 1000, height: 1620 };
    const photoPx = { width: 600, height: 900 };

    expect(targetLongEdge('4k', scene, photoPx)).toBe(3840);
    expect(targetLongEdge('2k', scene, photoPx)).toBe(1920);
    expect(targetLongEdge('sns', scene, photoPx)).toBe(1080);

    // 다른 장면/사진 크기를 넣어도 값이 바뀌지 않습니다.
    expect(targetLongEdge('4k', { width: 1, height: 1 }, { width: 1, height: 1 })).toBe(3840);
  });
});
