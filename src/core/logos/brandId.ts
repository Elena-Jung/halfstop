/**
 * EXIF 제조사 문자열(예: `NIKON CORPORATION`)이나 렌즈 제조사 추론 결과
 * (lensMaker.ts, 예: `TAMRON`)를 로고 id 로 바꾸는 규칙입니다. 규칙을 코드가 아니라
 * 데이터로 두어 로고를 추가하거나 뺄 때 판별 로직을 다시 짜지 않아도 되게 합니다.
 *
 * 배열 순서가 판별 결과를 정합니다. 먼저 맞는 규칙을 씁니다.
 */
export interface BrandIdRule {
  readonly pattern: RegExp;
  readonly id: string;
}

export const BRAND_ID_RULES: readonly BrandIdRule[] = [
  { pattern: /^SONY/, id: 'sony' },
  { pattern: /^NIKON/, id: 'nikon' },
  { pattern: /^CANON/, id: 'canon' },
  { pattern: /^FUJI/, id: 'fujifilm' },
  { pattern: /^PANASONIC/, id: 'panasonic' },
  // OM 디지털 솔루션즈가 올림푸스의 카메라 사업을 물려받았습니다. IMAGING/CORP 꼬리를
  // 떼도 "OLYMPUS" 로는 안 남으므로 올림푸스 규칙보다 먼저 둘 필요는 없지만, 읽는
  // 순서를 브랜드 계보에 맞춰 앞에 둡니다.
  { pattern: /^OM DIGITAL/, id: 'om-system' },
  { pattern: /^OLYMPUS/, id: 'olympus' },
  { pattern: /^LEICA/, id: 'leica' },
  { pattern: /^APPLE/, id: 'apple' },
  { pattern: /^SAMSUNG/, id: 'samsung' },
  { pattern: /^GOOGLE/, id: 'google' },
  { pattern: /^DJI/, id: 'dji' },
  { pattern: /^XIAOMI/, id: 'xiaomi' },
  { pattern: /^PENTAX/, id: 'pentax' },
  { pattern: /^RICOH/, id: 'ricoh' },
  { pattern: /^HASSELBLAD/, id: 'hasselblad' },
  { pattern: /^SIGMA/, id: 'sigma' },
  { pattern: /^TAMRON/, id: 'tamron' },
  { pattern: /^TOKINA/, id: 'tokina' },
  { pattern: /^LAOWA/, id: 'laowa' },
];

/** 꼬리에 흔히 붙는 법인격 표기입니다. 지워도 브랜드를 알아보는 데는 지장이 없습니다. */
const CORPORATE_TAIL = /\b(CORPORATION|CORP|IMAGING|OPTICAL|CO|LTD|INC)\b\.?/g;

function clean(raw: string): string {
  return raw
    .toUpperCase()
    .replace(CORPORATE_TAIL, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * EXIF 제조사 문자열이나 렌즈 제조사 추론 결과를 로고 id 로 바꿉니다. 못 알아보면
 * undefined 를 돌려줍니다. 던지지 않습니다.
 *
 * 로고 그림이 없는 브랜드(캐논, 리코, 올림푸스, OM 시스템, 핫셀블라드)도 id 는
 * 돌려줍니다. registry.hasLogo 가 그 id 에 대해 거짓을 내놓고, layout 이 워드마크로
 * 대체합니다.
 */
export function brandId(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const cleaned = clean(raw);
  if (cleaned === '') return undefined;
  return BRAND_ID_RULES.find((rule) => rule.pattern.test(cleaned))?.id;
}
