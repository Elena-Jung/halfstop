import { describe, expect, it } from 'vitest';
import { integer, rational, readExif } from './read';

describe('rational', () => {
  it('숫자 값은 그대로 돌려줍니다', () => {
    expect(rational({ value: 0.004 })).toBe(0.004);
  });

  it('[분자, 분모] 배열은 나눈 값을 돌려줍니다', () => {
    expect(rational({ value: [1, 250] })).toBe(0.004);
  });

  it('분모가 0이면 undefined입니다. 분자를 반환하면 안 됩니다', () => {
    expect(rational({ value: [1, 0] })).toBeUndefined();
  });

  it('[0, 0]은 값이 없는 것으로 봅니다', () => {
    expect(rational({ value: [0, 0] })).toBeUndefined();
  });

  it('길이가 2가 아닌 배열은 undefined입니다', () => {
    expect(rational({ value: [100, 200, 300] })).toBeUndefined();
  });

  it('태그가 없으면 undefined입니다', () => {
    expect(rational(undefined)).toBeUndefined();
  });
});

describe('integer', () => {
  it('숫자 값은 그대로 돌려줍니다', () => {
    expect(integer({ value: 400 })).toBe(400);
  });

  it('배열이면 나누지 않고 첫 값을 돌려줍니다', () => {
    expect(integer({ value: [400, 800] })).toBe(400);
  });

  it('숫자가 아니면 undefined입니다', () => {
    expect(integer({ value: 'ISO 400' })).toBeUndefined();
  });

  it('태그가 없으면 undefined입니다', () => {
    expect(integer(undefined)).toBeUndefined();
  });
});

describe('readExif', () => {
  it('EXIF 를 못 읽어도 던지지 않고 빈 정보를 돌려줍니다', async () => {
    // ExifReader 는 자기가 모르는 컨테이너에 `Invalid image format` 을 던집니다. 그
    // 예외가 올라가면 사진 한 장이 통째로 버려지고, 화면에는 무엇을 해야 할지 알 수 없는
    // "알 수 없는 문제가 생겼습니다" 가 떴습니다. EXIF 가 없는 것과 사진을 못 여는 것은
    // 다른 일이고, 그림을 열 수 있는지는 디코더가 정합니다.
    const garbage = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]).buffer;
    const meta = await readExif(garbage);
    expect(meta.make).toBeUndefined();
    expect(meta.model).toBeUndefined();
    // 방향은 값이 없을 때 1 로 떨어집니다. 회전을 적용하지 않는다는 뜻입니다.
    expect(meta.orientation).toBe(1);
  });

  it('빈 파일에서도 던지지 않습니다', async () => {
    const meta = await readExif(new ArrayBuffer(0));
    expect(meta.takenAtRaw).toBeUndefined();
    expect(meta.orientation).toBe(1);
  });
});
