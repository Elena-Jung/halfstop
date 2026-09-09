/**
 * core 의 오류 문구는 개발자를 향한 습니다체입니다. 화면에는 해요체로 바꿔
 * 내놓습니다. 설계 문서가 core 는 번역된 문자열을 반환하지 않는다고 정해 두었으니,
 * 이 변환은 UI 쪽에 있는 것이 맞습니다.
 */
export const RULES: ReadonlyArray<{ match: RegExp; text: string }> = [
  { match: /지원하지 않는 파일 형식/, text: '이 형식은 아직 못 읽어요. JPEG, PNG, WebP 를 넣어 주세요' },
  { match: /HEIC/, text: 'HEIC 는 아직 준비 중이에요. JPEG 로 바꿔서 넣어 주세요' },
  { match: /RAW/, text: 'RAW 는 아직 준비 중이에요. JPEG 로 바꿔서 넣어 주세요' },
  { match: /사진 크기가 올바르지 않습니다/, text: '사진 크기를 읽지 못했어요. 다른 파일로 해 보시겠어요' },
  { match: /인코딩을 지원하지 않습니다/, text: '이 브라우저가 그 형식으로 저장하지 못해요' },
  { match: /워커/, text: '만드는 도중에 멈췄어요. 다시 눌러 주세요' },
];

export function toUserMessage(error: unknown, fallback: string): string {
  if (!(error instanceof Error)) return fallback;
  const rule = RULES.find((candidate) => candidate.match.test(error.message));
  return rule ? rule.text : fallback;
}
