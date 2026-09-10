/**
 * Orientation=6 한 항목만 담은 APP1 세그먼트입니다.
 * FFE1, 길이 34, "Exif\0\0", 리틀엔디언 TIFF 헤더, 항목 1개짜리 IFD0으로 이루어집니다.
 */
const APP1_ORIENTATION_6 = new Uint8Array([
  0xff, 0xe1, 0x00, 0x22,
  0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
  0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
  0x01, 0x00,
  0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

/**
 * SOI 바로 뒤가 기본 위치입니다. 다만 캔버스가 만든 JPEG은 APP0(JFIF)으로 시작하고,
 * APP0보다 앞선 APP1을 무시하는 디코더가 있습니다. 그래서 APP0이 있으면 그 뒤로 넣습니다.
 */
function insertionPoint(jpeg: Uint8Array): number {
  if (jpeg[2] === 0xff && jpeg[3] === 0xe0) {
    const length = ((jpeg[4] ?? 0) << 8) | (jpeg[5] ?? 0);
    return 4 + length;
  }
  return 2;
}

export function buildOrientation6Jpeg(baseJpeg: Uint8Array): Uint8Array {
  const at = insertionPoint(baseJpeg);
  const out = new Uint8Array(baseJpeg.length + APP1_ORIENTATION_6.length);
  out.set(baseJpeg.subarray(0, at), 0);
  out.set(APP1_ORIENTATION_6, at);
  out.set(baseJpeg.subarray(at), at + APP1_ORIENTATION_6.length);
  return out;
}

/**
 * 3x2 JPEG에 Orientation=6을 붙여 디코딩합니다. 브라우저가 회전을 이미 적용했다면
 * 2x3으로 돌아옵니다. 판단이 불가능하면 회전을 적용하지 않은 쪽으로 봅니다.
 * 회전을 두 번 거는 것보다 한 번도 안 거는 쪽이 원인을 찾기 쉽기 때문입니다.
 */
export async function detectAutoOrientation(
  decode: (blob: Blob) => Promise<{ width: number; height: number; close?: () => void }>,
  baseJpeg: Uint8Array,
): Promise<boolean> {
  try {
    const tagged = buildOrientation6Jpeg(baseJpeg);
    const blob = new Blob([tagged as BlobPart], { type: 'image/jpeg' });
    const decoded = await decode(blob);
    const autoOriented = decoded.height > decoded.width;
    // createImageBitmap 이 만든 비트맵입니다. 작지만 다른 곳은 모두 닫으므로 여기도 닫습니다.
    decoded.close?.();
    return autoOriented;
  } catch {
    return false;
  }
}
