export type Matrix = [number, number, number, number, number, number];

export interface OrientedSize {
  /** 회전을 적용한 뒤의 가로 길이입니다. */
  width: number;
  /** 회전을 적용한 뒤의 세로 길이입니다. */
  height: number;
  /** `ctx.setTransform`에 그대로 넘길 수 있는 행렬입니다. */
  matrix: Matrix;
}

export function swapsAxes(orientation: number): boolean {
  return orientation >= 5 && orientation <= 8;
}

export function orientationTransform(orientation: number, width: number, height: number): OrientedSize {
  const swapped = swapsAxes(orientation);
  const outWidth = swapped ? height : width;
  const outHeight = swapped ? width : height;

  // 각 행렬은 원본 픽셀을 출력 좌표계의 (0,0)-(outWidth,outHeight)로 옮깁니다.
  const matrices: Record<number, Matrix> = {
    1: [1, 0, 0, 1, 0, 0],
    2: [-1, 0, 0, 1, width, 0],
    3: [-1, 0, 0, -1, width, height],
    4: [1, 0, 0, -1, 0, height],
    5: [0, 1, 1, 0, 0, 0],
    6: [0, 1, -1, 0, height, 0],
    7: [0, -1, -1, 0, height, width],
    8: [0, -1, 1, 0, 0, width],
  };

  return { width: outWidth, height: outHeight, matrix: matrices[orientation] ?? matrices[1]! };
}
