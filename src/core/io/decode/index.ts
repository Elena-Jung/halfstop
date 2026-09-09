import { sniff, SNIFF_BYTES, type FileKind } from '../sniff';
import { decodeRaster, type DecodedImage, type RasterRequest } from './raster';

export type { DecodedImage };
export type DecodeRequest = RasterRequest;

export async function detectKind(file: Blob): Promise<FileKind> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  return sniff(head);
}

export async function decodeImage(request: DecodeRequest): Promise<DecodedImage> {
  const kind = await detectKind(request.file);
  switch (kind) {
    case 'jpeg':
    case 'png':
    case 'webp':
      return decodeRaster(request);
    case 'heic':
      throw new Error('HEIC는 다음 단계에서 지원합니다');
    case 'tiff':
    case 'cr3':
      throw new Error('RAW는 다음 단계에서 지원합니다');
    case 'unknown':
      throw new Error('지원하지 않는 파일 형식입니다');
  }
}
