/**
 * 렌즈 모델 문자열에서 제조사를 추론하는 규칙입니다. 규칙을 코드가 아니라 데이터로
 * 두어 새 렌즈군을 추가할 때 판별 로직을 다시 짜지 않아도 되게 합니다.
 *
 * 배열 순서가 판별 결과를 정합니다. 먼저 맞는 규칙을 씁니다.
 */
export interface LensMakerRule {
  readonly pattern: RegExp;
  readonly maker: string;
}

export const LENS_MAKER_RULES: readonly LensMakerRule[] = [
  // 탐론의 모델 코드 표기입니다. 사용자 사진의 A063이 그것입니다. 이 문자열은 아래
  // 소니 E 마운트 규칙에도 걸리므로, 이 규칙이 배열에서 그보다 먼저 와야 합니다.
  { pattern: /\b[AB]\d{3}$/, maker: 'TAMRON' },
  { pattern: /^SIGMA/, maker: 'SIGMA' },
  { pattern: /^TAMRON/, maker: 'TAMRON' },
  // 같은 렌즈의 두 이름입니다.
  { pattern: /^(SAMYANG|ROKINON)/, maker: 'SAMYANG' },
  { pattern: /^(ZEISS|Batis|Loxia)/, maker: 'ZEISS' },
  { pattern: /^(Voigtlander|VOIGTLANDER)/, maker: 'VOIGTLANDER' },
  { pattern: /NIKKOR/, maker: 'NIKON' },
  // 소니 E 마운트 표기입니다.
  { pattern: /^(FE|E) \d/, maker: 'SONY' },
  { pattern: /^(RF|EF)(-S)? ?\d/, maker: 'CANON' },
];

/** 렌즈 모델 문자열만으로 제조사를 추론합니다. 아무 규칙도 맞지 않으면 undefined입니다. */
export function inferLensMaker(lensModel: string | undefined): string | undefined {
  if (lensModel === undefined) return undefined;
  return LENS_MAKER_RULES.find((rule) => rule.pattern.test(lensModel))?.maker;
}

/**
 * 추론이 EXIF의 LensMake보다 먼저입니다. 서드파티 렌즈를 물린 바디는 LensMake를
 * 비워 두거나 자기 이름을 적어 두므로, EXIF 값을 그대로 쓰면 틀린 제조사를 사용자
 * 사진에 새겨 넣게 됩니다. 모델 문자열로 판별이 되면 그 값을 쓰고, 아무것도 안
 * 맞을 때만 EXIF의 LensMake로 떨어집니다. 둘 다 없으면 undefined입니다.
 */
export function resolveLensMaker(
  lensModel: string | undefined,
  lensMakeFromExif: string | undefined,
): string | undefined {
  return inferLensMaker(lensModel) ?? lensMakeFromExif;
}
