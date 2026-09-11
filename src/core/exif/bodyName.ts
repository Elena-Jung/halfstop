/**
 * 소니는 EXIF `Model` 에 내부 코드명을 적습니다. `ILCE-7M3` 처럼 앞머리 `ILCE-`
 * (Interchangeable Lens Camera E-mount, 알파 미러리스) 나 `ILCA-`(알파 SLT/DSLR) 가
 * 붙습니다. 이 앞머리는 소니 내부 분류일 뿐이라 사진에 새겨 넣을 글자가 아닙니다.
 * 사용자가 실제 표기 `A7M3` 으로 그리기로 정했습니다. 규칙을 코드가 아니라 데이터로
 * 두어 기종이 늘어나도(소니 바디는 계속 나옵니다) 판별 로직을 다시 짜지 않아도
 * 되게 합니다. lensMaker.ts 의 규칙 배열을 본보기로 삼았습니다.
 *
 * 규칙은 앞머리를 `A` 로 바꾸는 것 하나뿐이고 뒤는 건드리지 않습니다. `M3` 을 로마
 * 숫자 `III` 로 바꾸지 않습니다. 사용자가 코드명 그대로를 원하기도 하고, 그 변환을
 * 넣으면 올림푸스의 `E-M1` 이 `E- I` 이 되는 함정까지 따라옵니다.
 *
 * 소니 컴팩트(`DSC-RX100M7`)는 대상이 아닙니다. `DSC-` 를 붙여 파는 기종이 섞여
 * 있고, 사용자가 지목한 것은 `ILCE` 와 `ILCA` 뿐입니다.
 */
export interface BodyNameRule {
  readonly pattern: RegExp;
  readonly replacement: string;
}

export const BODY_NAME_RULES: readonly BodyNameRule[] = [
  { pattern: /^ILCE-/, replacement: 'A' },
  { pattern: /^ILCA-/, replacement: 'A' },
];

/**
 * 카메라 바디의 코드명을 실제 표기로 바꿉니다. 맞는 규칙이 없으면(니콘, 후지필름,
 * 올림푸스처럼 `ILCE-`/`ILCA-` 로 시작하지 않는 모델) 원래 값을 그대로 돌려줍니다.
 */
export function bodyName(model: string | undefined): string | undefined {
  if (model === undefined) return undefined;
  const rule = BODY_NAME_RULES.find((r) => r.pattern.test(model));
  if (rule === undefined) return model;
  return model.replace(rule.pattern, rule.replacement);
}
