import ExifReader from 'exifreader';

export interface PhotoMeta {
  make: string | undefined;
  model: string | undefined;
  lensModel: string | undefined;
  /**
   * 바디가 렌즈 제조사로 기록한 값입니다. 서드파티 렌즈를 물리면 비어 있거나
   * 바디 자신의 이름이 적히기도 합니다. 그대로 믿지 말고 lensMaker.ts의 모델
   * 문자열 추론을 먼저 적용하십시오.
   */
  lensMake: string | undefined;
  focalLength: number | undefined;
  focalLengthIn35mm: number | undefined;
  fNumber: number | undefined;
  iso: number | undefined;
  exposureTime: number | undefined;
  orientation: number;
  takenAtRaw: string | undefined;
  /** 원본 픽셀 크기입니다. 미리보기를 어느 축으로 줄일지 정하는 데 씁니다. */
  pixelWidth: number | undefined;
  pixelHeight: number | undefined;
}

function text(tag: { description?: unknown } | undefined): string | undefined {
  const value = tag?.description;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

/**
 * exifreader는 유리수를 [분자, 분모]로 돌려주기도 합니다. 분모가 0이면 값이
 * 없는 것으로 봅니다. 예전에는 여기서 빠져나간 뒤 아래 배열 분기에 다시 걸려
 * 분자를 값처럼 돌려주는 경로가 있었습니다.
 *
 * 내부 헬퍼지만 검증을 위해 내보냅니다.
 */
export function rational(tag: { value?: unknown } | undefined): number | undefined {
  const value = tag?.value;
  if (typeof value === 'number') return value;
  if (Array.isArray(value) && value.length === 2) {
    const [n, d] = value;
    if (typeof n === 'number' && typeof d === 'number') {
      return d === 0 ? undefined : n / d;
    }
  }
  return undefined;
}

/**
 * 유리수가 아닌 정수 태그입니다. 길이만 보고 유리수로 넘겨짚으면 안 됩니다.
 * ISO를 두 원소 배열로 적는 카메라가 있는데, 그것을 나눠 버리면 엉뚱한 값이
 * 화면에 나갑니다.
 *
 * 내부 헬퍼지만 검증을 위해 내보냅니다.
 */
export function integer(tag: { value?: unknown } | undefined): number | undefined {
  const value = tag?.value;
  if (typeof value === 'number') return value;
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0];
  return undefined;
}

/**
 * EXIF는 항상 원본 파일에서 읽습니다. 디코딩 결과물에서 읽으면 안 됩니다.
 * HEIC를 JPEG로 바꾼 뒤 읽으면 메타데이터가 이미 사라졌거나 달라져 있습니다.
 */
export async function readExif(buffer: ArrayBuffer): Promise<PhotoMeta> {
  const tags = await ExifReader.load(buffer, { expanded: false, async: true });
  return {
    make: text(tags.Make),
    model: text(tags.Model),
    lensModel: text(tags.LensModel),
    lensMake: text(tags.LensMake),
    focalLength: rational(tags.FocalLength),
    focalLengthIn35mm: integer(tags.FocalLengthIn35mmFilm),
    fNumber: rational(tags.FNumber),
    iso: integer(tags.ISOSpeedRatings),
    exposureTime: rational(tags.ExposureTime),
    orientation: integer(tags.Orientation) ?? 1,
    takenAtRaw: text(tags.DateTimeOriginal),
    pixelWidth: integer(tags.PixelXDimension) ?? integer(tags.ImageWidth),
    pixelHeight: integer(tags.PixelYDimension) ?? integer(tags.ImageLength),
  };
}
