import { describe, expect, it } from 'vitest';
import { sniff } from './sniff';

function bytes(...values: number[]): Uint8Array {
  const buffer = new Uint8Array(32);
  buffer.set(values, 0);
  return buffer;
}

function ftyp(brand: string): Uint8Array {
  const buffer = new Uint8Array(32);
  buffer.set([0x00, 0x00, 0x00, 0x18], 0);
  buffer.set([...'ftyp'].map((c) => c.charCodeAt(0)), 4);
  buffer.set([...brand].map((c) => c.charCodeAt(0)), 8);
  return buffer;
}

describe('sniff', () => {
  it('JPEG을 판별합니다', () => {
    expect(sniff(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg');
  });

  it('PNG를 판별합니다', () => {
    expect(sniff(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
  });

  it('WebP를 판별합니다', () => {
    const buffer = new Uint8Array(32);
    buffer.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0);
    buffer.set([...'WEBP'].map((c) => c.charCodeAt(0)), 8);
    expect(sniff(buffer)).toBe('webp');
  });

  it('HEIC 브랜드들을 판별합니다', () => {
    for (const brand of ['heic', 'heix', 'mif1', 'msf1', 'heim']) {
      expect(sniff(ftyp(brand))).toBe('heic');
    }
  });

  it('CR3를 HEIC와 구분합니다', () => {
    expect(sniff(ftyp('crx '))).toBe('cr3');
  });

  it('리틀엔디언과 빅엔디언 TIFF를 모두 판별합니다', () => {
    expect(sniff(bytes(0x49, 0x49, 0x2a, 0x00))).toBe('tiff');
    expect(sniff(bytes(0x4d, 0x4d, 0x00, 0x2a))).toBe('tiff');
  });

  it('모르는 형식은 unknown입니다', () => {
    expect(sniff(bytes(0x00, 0x01, 0x02, 0x03))).toBe('unknown');
    expect(sniff(new Uint8Array(2))).toBe('unknown');
  });
});
