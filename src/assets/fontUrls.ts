// Vite가 이 woff2들을 자산으로 다루고 최종 URL 문자열을 돌려줍니다.
// 라틴 서브셋 가변 폰트라 EXIF 문자열에 필요한 글자를 모두 담고 크기도 작습니다.
// Pretendard만 한글을 포함해 약 2MB이고, 고른 사람만 내려받습니다.
import interUrl from '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url';
import literataUrl from '@fontsource-variable/literata/files/literata-latin-wght-normal.woff2?url';
import monoUrl from '@fontsource-variable/jetbrains-mono/files/jetbrains-mono-latin-wght-normal.woff2?url';
import pretendardUrl from 'pretendard/dist/web/variable/woff2/PretendardVariable.woff2?url';

const URLS: Record<string, string> = {
  inter: interUrl,
  literata: literataUrl,
  'jetbrains-mono': monoUrl,
  pretendard: pretendardUrl,
};

export function fontUrl(id: string): string {
  const url = URLS[id];
  if (!url) throw new Error(`${id} 서체의 파일 주소를 찾지 못했습니다`);
  return url;
}
