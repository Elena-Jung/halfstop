export type ExportFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export async function encodeCanvas(
  canvas: OffscreenCanvas,
  format: ExportFormat,
  quality: number,
): Promise<Blob> {
  const blob = await canvas.convertToBlob({ type: format, quality });
  if (blob.type !== format) {
    throw new Error(`${format} 인코딩을 지원하지 않습니다. 받은 형식은 ${blob.type}입니다`);
  }
  return blob;
}
