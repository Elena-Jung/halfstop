/**
 * core 의 오류 문구는 개발자를 향합니다. `HEIC는 다음 단계에서 지원합니다` 처럼
 * 사용자가 알 수 없는 내부 사정을 담기도 합니다. 화면에는 사용자가 무엇을 하면
 * 되는지 알 수 있는 문구로 바꿔 내놓습니다.
 *
 * 설계 문서가 core 는 번역된 문자열을 반환하지 않는다고 정해 두었으니, 이 변환은
 * UI 쪽에 있는 것이 맞습니다.
 */
export const RULES: ReadonlyArray<{ match: RegExp; text: string }> = [
  { match: /지원하지 않는 파일 형식/, text: '이 형식은 아직 읽지 못합니다. JPEG, PNG, WebP 를 넣어 주십시오' },
  { match: /HEIC/, text: 'HEIC 는 아직 준비 중입니다. JPEG 로 바꿔서 넣어 주십시오' },
  { match: /RAW/, text: 'RAW 는 아직 준비 중입니다. JPEG 로 바꿔서 넣어 주십시오' },
  { match: /사진 크기가 올바르지 않습니다/, text: '사진 크기를 읽지 못했습니다. 다른 파일로 시도해 주십시오' },
  { match: /인코딩을 지원하지 않습니다/, text: '이 브라우저는 그 형식으로 저장하지 못합니다' },
  { match: /워커/, text: '만드는 도중에 멈췄습니다. 다시 눌러 주십시오' },
];

export function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const rule = RULES.find((candidate) => candidate.match.test(error.message));
  return rule ? rule.text : fallback;
}
