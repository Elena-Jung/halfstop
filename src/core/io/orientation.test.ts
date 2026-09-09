import { describe, expect, it } from 'vitest';
import { orientationTransform, swapsAxes } from './orientation';

describe('orientationTransform', () => {
  it('1은 아무것도 바꾸지 않습니다', () => {
    const result = orientationTransform(1, 400, 300);
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(result.matrix).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it('6은 가로세로를 바꿉니다', () => {
    const result = orientationTransform(6, 400, 300);
    expect(result.width).toBe(300);
    expect(result.height).toBe(400);
  });

  it('8도 가로세로를 바꿉니다', () => {
    const result = orientationTransform(8, 400, 300);
    expect(result.width).toBe(300);
    expect(result.height).toBe(400);
  });

  it('3은 크기를 유지합니다', () => {
    const result = orientationTransform(3, 400, 300);
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });

  it('알 수 없는 값은 1로 취급합니다', () => {
    expect(orientationTransform(0, 400, 300).matrix).toEqual([1, 0, 0, 1, 0, 0]);
    expect(orientationTransform(99, 400, 300).matrix).toEqual([1, 0, 0, 1, 0, 0]);
  });
});

describe('swapsAxes', () => {
  it('5부터 8까지가 축을 바꿉니다', () => {
    expect([1, 2, 3, 4].map(swapsAxes)).toEqual([false, false, false, false]);
    expect([5, 6, 7, 8].map(swapsAxes)).toEqual([true, true, true, true]);
  });
});
