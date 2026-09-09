/**
 * 요청한 타입을 무시하고 PNG를 돌려주는 브라우저가 있습니다.
 * 그래서 성공 여부가 아니라 반환된 Blob의 타입을 봐야 합니다.
 */
export async function canvasSupportsWebp(): Promise<boolean> {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
    return blob.type === 'image/webp';
  } catch {
    return false;
  }
}
