import type { MessageKey } from '../i18n';

/**
 * core 의 오류 문구는 개발자를 향합니다. `HEIC는 다음 단계에서 지원합니다` 처럼
 * 사용자가 알 수 없는 내부 사정을 담기도 합니다. 화면에는 사용자가 무엇을 하면
 * 되는지 알 수 있는 키로 바꿔 내놓고, 실제 문구는 t() 가 사전에서 찾습니다.
 *
 * 설계 문서가 core 는 번역된 문자열을 반환하지 않는다고 정해 두었으니, 이 변환은
 * UI 쪽에 있는 것이 맞습니다.
 */
interface Rule {
  match: RegExp;
  key: MessageKey;
}

export const RULES: readonly Rule[] = [
  // 지원하지 않는 형식, HEIC, RAW, 잘못된 사진 크기는 모두 이 사진을 열 수 없다는
  // 뜻이라 같은 키로 모읍니다.
  { match: /지원하지 않는 파일 형식/, key: 'error.decode' },
  { match: /HEIC/, key: 'error.decode' },
  { match: /RAW/, key: 'error.decode' },
  { match: /사진 크기가 올바르지 않습니다/, key: 'error.decode' },
  // 브라우저가 요청한 형식으로 인코딩하지 못하는 경우입니다. 그리기 자체가 아니라
  // 저장 단계의 문제이지만, 사전에 인코딩 전용 키가 따로 없어 같은 브라우저 능력
  // 문제인 캔버스 키로 묶었습니다. 대응이 정확하지 않을 수 있어 보고서에 남깁니다.
  { match: /인코딩을 지원하지 않습니다/, key: 'error.canvas' },
  { match: /워커/, key: 'error.worker' },
];

export function toUserMessage(error: unknown): MessageKey {
  const message = error instanceof Error ? error.message : String(error);
  for (const rule of RULES) if (rule.match.test(message)) return rule.key;
  return 'error.unknown';
}
