// 내보내기 형식 목록에서 WebP 를 넣을지 정하는 데 씁니다. 브라우저가 요청한 타입을
// 무시하고 PNG 를 돌려주는 경우를 걸러내는 것이 목적입니다.
/**
 * 요청한 타입을 무시하고 PNG를 돌려주는 브라우저가 있습니다.
 * 그래서 성공 여부가 아니라 반환된 Blob의 타입을 봐야 합니다.
 */
export async function canvasSupportsWebp(): Promise<boolean> {
  try {
    const canvas = new OffscreenCanvas(1, 1);
    // 컨텍스트 없는 OffscreenCanvas 는 convertToBlob 에서 InvalidStateError 를 던집니다.
    // 이 줄이 없으면 아래 catch 가 그것을 삼켜, WebP 를 만들 수 있는 브라우저에서도
    // 언제나 거짓이 돌아갑니다. 실제로 그랬습니다.
    canvas.getContext('2d');
    const blob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.9 });
    return blob.type === 'image/webp';
  } catch {
    return false;
  }
}
