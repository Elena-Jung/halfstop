export type FileKind = 'jpeg' | 'png' | 'webp' | 'heic' | 'tiff' | 'cr3' | 'unknown';

/** `sniff`에 넘겨야 하는 최소 바이트 수입니다. */
export const SNIFF_BYTES = 16;

const HEIC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'mif1', 'msf1', 'avif']);

function ascii(head: Uint8Array, start: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const byte = head[start + i];
    if (byte === undefined) return '';
    out += String.fromCharCode(byte);
  }
  return out;
}

function startsWith(head: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => head[index] === value);
}

export function sniff(head: Uint8Array): FileKind {
  if (head.length < 12) return 'unknown';

  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WEBP') return 'webp';

  if (ascii(head, 4, 4) === 'ftyp') {
    const brand = ascii(head, 8, 4);
    if (brand === 'crx ') return 'cr3';
    if (HEIC_BRANDS.has(brand)) return 'heic';
    return 'unknown';
  }

  // TIFF 헤더는 CR2, NEF, ARW, DNG 같은 RAW 포맷의 공통 뼈대이기도 합니다.
  if (startsWith(head, [0x49, 0x49, 0x2a, 0x00])) return 'tiff';
  if (startsWith(head, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff';

  return 'unknown';
}
