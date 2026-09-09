// 아직 호출부가 없습니다. 다음 계획에서 출력 포맷 선택을 붙일 때 씁니다.
// 브라우저가 요청한 타입을 무시하고 PNG 를 돌려주는 경우를 걸러내는 것이 목적입니다.
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
