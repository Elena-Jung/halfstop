import { describe, expect, it } from 'vitest';
import {
  displayBounds,
  displayStep,
  displayValue,
  pxPerUnitFor,
  storedValue,
} from './unitScale';

// 6016x4016 사진에 하단 바를 붙인 장면입니다. 짧은 변이 1000u 이므로 장면은
// 1498.0...u x 1127.4...u 이고, 원본 크기로 내보내면 1u 가 짧은 변 4016 / 1000 =
// 4.016px 이 됩니다.
const PHOTO = { width: 6016, height: 4016 };
const SCENE = { width: (6016 * 1000) / 4016, height: 1000 + 102 };

describe('pxPerUnitFor', () => {
  it('원본 크기에서는 사진 짧은 변을 1000 으로 나눈 값입니다', () => {
    expect(pxPerUnitFor('original', SCENE, PHOTO)).toBeCloseTo(4.016, 9);
  });

  it('세로 사진도 짧은 변이 같으면 같은 값이 나옵니다', () => {
    // 디자인 단위가 짧은 변 기준이라 방향이 바뀌어도 1u 의 크기는 같습니다.
    const portrait = { width: 4016, height: 6016 };
    const portraitScene = { width: 1000, height: (6016 * 1000) / 4016 + 102 };
    expect(pxPerUnitFor('original', portraitScene, portrait)).toBeCloseTo(4.016, 9);
  });

  it('내보내기 크기를 줄이면 1u 도 함께 작아집니다', () => {
    // 2K 는 긴 변을 1920 으로 맞춥니다. 장면의 긴 변이 1498.0...u 이므로 그 비입니다.
    const expected = 1920 / Math.max(SCENE.width, SCENE.height);
    expect(pxPerUnitFor('2k', SCENE, PHOTO)).toBeCloseTo(expected, 9);
    expect(pxPerUnitFor('2k', SCENE, PHOTO)!).toBeLessThan(pxPerUnitFor('original', SCENE, PHOTO)!);
  });

  it('사진의 원본 크기를 모르면 null 입니다', () => {
    // EXIF 가 없는 파일입니다. 환산할 수 없으므로 부르는 쪽이 px 단추를 내보내지 않습니다.
    expect(pxPerUnitFor('original', SCENE, undefined)).toBeNull();
  });

  it('장면이 아직 없으면 null 입니다', () => {
    expect(pxPerUnitFor('original', null, PHOTO)).toBeNull();
  });
});

describe('displayValue', () => {
  it('u 모드에서는 값을 그대로 보입니다', () => {
    expect(displayValue(102, 'u', 4.016)).toBe(102);
  });

  it('px 모드에서는 정수로 반올림합니다', () => {
    // 102 * 4.016 = 409.632 입니다. 소수점 픽셀은 읽을 이유가 없습니다.
    expect(displayValue(102, 'px', 4.016)).toBe(410);
  });

  it('환산할 수 없으면 px 모드라도 u 값을 그대로 보입니다', () => {
    expect(displayValue(102, 'px', null)).toBe(102);
  });
});

describe('storedValue', () => {
  it('u 모드에서는 받은 값을 그대로 저장합니다', () => {
    expect(storedValue(102, 'u', 4.016)).toBe(102);
  });

  it('px 모드에서는 u 로 되돌리고 소수점 둘째 자리에서 끊습니다', () => {
    // 410 / 4.016 = 102.0916... 입니다. 끊지 않으면 긴 부동소수점이 저장되고 u 로
    // 돌아왔을 때 화면이 지저분해집니다.
    expect(storedValue(410, 'px', 4.016)).toBe(102.09);
  });

  it('왕복해도 원래 값에서 크게 벗어나지 않습니다', () => {
    const roundTrip = storedValue(displayValue(102, 'px', 4.016), 'px', 4.016);
    expect(Math.abs(roundTrip - 102)).toBeLessThan(0.15);
  });
});

describe('displayBounds', () => {
  it('u 모드에서는 선언 그대로입니다', () => {
    expect(displayBounds(40, 500, 'u', 4.016)).toEqual({ min: 40, max: 500 });
  });

  it('px 모드에서는 최소를 올리고 최대를 내립니다', () => {
    // 되돌린 값이 선언 범위를 벗어나면 안 되므로 안쪽으로 끊습니다.
    // 40 * 4.016 = 160.64 -> 161, 500 * 4.016 = 2008 -> 2008 입니다.
    expect(displayBounds(40, 500, 'px', 4.016)).toEqual({ min: 161, max: 2008 });
    expect(storedValue(161, 'px', 4.016)).toBeGreaterThanOrEqual(40);
  });
});

describe('displayStep', () => {
  it('px 모드의 증감 폭은 1픽셀입니다', () => {
    // 1u 가 보통 3에서 5픽셀이라 선언 폭을 그대로 두면 너무 성큼 뜁니다.
    expect(displayStep(1, 'px')).toBe(1);
    expect(displayStep(1, 'u')).toBe(1);
  });
});
