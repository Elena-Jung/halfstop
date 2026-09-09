import { describe, expect, it } from 'vitest';
import { buildOrientation6Jpeg, detectAutoOrientation } from './autoOrientProbe';

/** SOI, 최소한의 SOF0, EOI만 담은 가짜 JPEG입니다. 바이트 삽입 위치만 검증합니다. */
const FAKE_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x00, 0xff, 0xd9]);

describe('buildOrientation6Jpeg', () => {
  it('SOI 바로 뒤에 APP1을 넣습니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    expect([out[0], out[1]]).toEqual([0xff, 0xd8]);
    expect([out[2], out[3]]).toEqual([0xff, 0xe1]);
  });

  it('APP1 길이 필드가 실제 세그먼트 길이와 맞습니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    const declared = (out[4]! << 8) | out[5]!;
    expect(declared).toBe(34);
  });

  it('Exif 식별자와 Orientation 태그를 담습니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    expect(String.fromCharCode(...out.slice(6, 10))).toBe('Exif');
    // 6번지 Exif(6) + 12번지 TIFF 헤더(8) + 20번지 IFD 항목 수(2) 다음이 태그입니다.
    expect([out[20], out[21]]).toEqual([0x01, 0x00]);
    expect([out[22], out[23]]).toEqual([0x12, 0x01]);
    // 태그(2) + 타입(2) + 개수(4) 뒤 30번지에 값 6이 SHORT로 들어갑니다.
    expect([out[30], out[31]]).toEqual([0x06, 0x00]);
  });

  it('APP0이 앞에 있으면 그 뒤에 넣습니다', () => {
    const withApp0 = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xe0, 0x00, 0x10,
      0x4a, 0x46, 0x49, 0x46, 0x00,
      0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xff, 0xd9,
    ]);
    const out = buildOrientation6Jpeg(withApp0);
    // APP0 세그먼트는 20번지에서 끝납니다.
    expect([out[20], out[21]]).toEqual([0xff, 0xe1]);
    expect([out[2], out[3]]).toEqual([0xff, 0xe0]);
  });

  it('원본 나머지 바이트를 그대로 뒤에 붙입니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    expect(out.slice(-FAKE_JPEG.length + 2)).toEqual(FAKE_JPEG.slice(2));
    expect(out.length).toBe(FAKE_JPEG.length + 36);
  });
});

describe('detectAutoOrientation', () => {
  it('가로세로가 뒤집혀 오면 자동 회전으로 봅니다', async () => {
    const decode = async () => ({ width: 2, height: 3 });
    await expect(detectAutoOrientation(decode, FAKE_JPEG)).resolves.toBe(true);
  });

  it('원본 그대로 오면 자동 회전이 아닙니다', async () => {
    const decode = async () => ({ width: 3, height: 2 });
    await expect(detectAutoOrientation(decode, FAKE_JPEG)).resolves.toBe(false);
  });

  it('디코딩이 실패하면 자동 회전이 아닌 쪽으로 판단합니다', async () => {
    const decode = async () => {
      throw new Error('decode failed');
    };
    await expect(detectAutoOrientation(decode, FAKE_JPEG)).resolves.toBe(false);
  });
});
