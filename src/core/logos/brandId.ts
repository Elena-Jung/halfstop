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

/**
 * 꼬리에 흔히 붙는 법인격 표기입니다. 지워도 브랜드를 알아보는 데는 지장이 없습니다.
 * 대소문자를 가리지 않습니다. brandLabel 이 원문 대소문자를 지킨 채 이 꼬리만 떼는 데
 * 같은 규칙을 쓰기 때문입니다.
 */
const CORPORATE_TAIL = /\b(CORPORATION|CORP|COMPANY|IMAGING|OPTICAL|CO|LTD|INC)\b\.?/gi;

/**
 * 화면과 프레임에 보일 제조사 이름입니다. EXIF 의 Make 는 법인명이라 길고, 그대로 그리면
 * 자리를 넘겨 잘립니다. 사용자의 실제 니콘 사진에서 `NIKON CORPORATION` 이
 * `NIKON CORPORAT...` 으로 잘렸습니다.
 *
 * 법인격 꼬리만 떼고 **원문의 대소문자는 그대로 둡니다.** 브랜드마다 표기가
 * 달라(`SONY`, `Canon`, `Panasonic`) 한쪽으로 맞추면 어느 쪽이든 어색해집니다. EXIF 가
 * 적어 준 표기가 대개 그 브랜드의 표기입니다.
 *
 * 떼고 나면 아무것도 안 남는 이상한 값은 원문을 그대로 돌려줍니다.
 */
export function brandLabel(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw
    .replace(CORPORATE_TAIL, '')
    .replace(/[.,]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return trimmed === '' ? raw : trimmed;
}

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
 * 로고 그림이 없는 브랜드(OM 시스템)도 id 는 돌려줍니다. registry.hasLogo 가 그 id 에
 * 대해 거짓을 내놓고, layout 이 워드마크로 대체합니다.
 */
export function brandId(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const cleaned = clean(raw);
  if (cleaned === '') return undefined;
  return BRAND_ID_RULES.find((rule) => rule.pattern.test(cleaned))?.id;
}
