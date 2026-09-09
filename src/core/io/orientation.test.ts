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

  describe('행렬 전수 검증', () => {
    it('모든 orientation의 행렬 값이 정확합니다', () => {
      const input = { width: 400, height: 300 };
      const expectedMatrices = {
        1: [1, 0, 0, 1, 0, 0],
        2: [-1, 0, 0, 1, 400, 0],
        3: [-1, 0, 0, -1, 400, 300],
        4: [1, 0, 0, -1, 0, 300],
        5: [0, 1, 1, 0, 0, 0],
        6: [0, 1, -1, 0, 300, 0],
        7: [0, -1, -1, 0, 300, 400],
        8: [0, -1, 1, 0, 0, 400],
      } as const;

      for (let orientation = 1; orientation <= 8; orientation++) {
        const result = orientationTransform(orientation, input.width, input.height);
        const expected = expectedMatrices[orientation as keyof typeof expectedMatrices];
        expect(result.matrix).toEqual(expected);
      }
    });

    it('모든 orientation에서 네 모서리가 출력 좌표계 안에 옵니다', () => {
      const input = { width: 400, height: 300 };
      const corners: Array<[number, number]> = [[0, 0], [400, 0], [400, 300], [0, 300]];

      // 행렬 변환: x' = a*x + c*y + e, y' = b*x + d*y + f
      const transform = (x: number, y: number, matrix: readonly [number, number, number, number, number, number]) => {
        const [a, b, c, d, e, f] = matrix;
        return {
          x: a * x + c * y + e,
          y: b * x + d * y + f,
        };
      };

      for (let orientation = 1; orientation <= 8; orientation++) {
        const result = orientationTransform(orientation, input.width, input.height);
        const { width: outWidth, height: outHeight, matrix } = result;

        // 네 모서리를 변환합니다
        const transformedCorners = corners.map(([x, y]) => transform(x, y, matrix));

        // 변환된 점들의 x, y 범위를 확인합니다
        const xs: number[] = transformedCorners.map((p) => p.x);
        const ys: number[] = transformedCorners.map((p) => p.y);

        const minX = Math.min(...xs);
        const maxX = Math.max(...xs);
        const minY = Math.min(...ys);
        const maxY = Math.max(...ys);

        expect(minX).toBe(0);
        expect(maxX).toBe(outWidth);
        expect(minY).toBe(0);
        expect(maxY).toBe(outHeight);
      }
    });
  });
});

describe('swapsAxes', () => {
  it('5부터 8까지가 축을 바꿉니다', () => {
    expect([1, 2, 3, 4].map(swapsAxes)).toEqual([false, false, false, false]);
    expect([5, 6, 7, 8].map(swapsAxes)).toEqual([true, true, true, true]);
  });
});
