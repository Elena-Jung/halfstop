import ExifReader from 'exifreader';

export interface PhotoMeta {
  make: string | undefined;
  model: string | undefined;
  lensModel: string | undefined;
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

function number(tag: { value?: unknown } | undefined): number | undefined {
  const value = tag?.value;
  if (typeof value === 'number') return value;
  // exifreader는 유리수를 [분자, 분모]로 돌려주기도 합니다.
  if (Array.isArray(value) && value.length === 2) {
    const [n, d] = value;
    if (typeof n === 'number' && typeof d === 'number' && d !== 0) return n / d;
  }
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
    focalLength: number(tags.FocalLength),
    focalLengthIn35mm: number(tags.FocalLengthIn35mmFilm),
    fNumber: number(tags.FNumber),
    iso: number(tags.ISOSpeedRatings),
    exposureTime: number(tags.ExposureTime),
    orientation: number(tags.Orientation) ?? 1,
    takenAtRaw: text(tags.DateTimeOriginal),
    pixelWidth: number(tags.PixelXDimension) ?? number(tags.ImageWidth),
    pixelHeight: number(tags.PixelYDimension) ?? number(tags.ImageLength),
  };
}
