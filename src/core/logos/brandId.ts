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
 *
 * `CAMERA` 와 `AG` 는 라이카의 법인명 `LEICA CAMERA AG` 때문에 더했습니다. `AG` 는
 * 독일의 주식회사 표기로 `CO`, `LTD`, `INC` 와 같은 자리입니다.
 */
const CORPORATE_TAIL = /\b(CORPORATION|CORP|COMPANY|IMAGING|OPTICAL|CAMERA|CO|LTD|INC|AG)\b\.?/gi;

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

/**
 * 니콘, 캐논, 라이카처럼 EXIF 의 Model 이 제조사 이름으로 시작하는 바디가 있습니다.
 * `MAKER`(brandLabel(make))와 `BODY`(model)를 나란히 그리면 브랜드가 두 번 나옵니다.
 * 이 함수가 model 앞머리에서 brandLabel(make)와 겹치는 부분만 뗍니다.
 *
 * 대소문자를 가리지 않고 견주되, 앞머리 뒤가 낱말 경계(공백 또는 하이픈)일 때만
 * 뗍니다. 그렇지 않으면 제조사 `OM` 이 모델 `OM-1` 의 하이픈 앞에서 걸려 뗀 뒤 `1` 만
 * 남습니다. 리코처럼 모델이 다른 브랜드 이름(`PENTAX`)으로 시작해도 그 이름이
 * brandLabel(make)(`RICOH`)와 다르면 그대로 둡니다.
 */
export function bodyLabel(model: string | undefined, make: string | undefined): string | undefined {
  if (model === undefined) return undefined;
  const label = brandLabel(make);
  if (label === undefined) return model;

  const prefixLength = label.length;
  if (model.slice(0, prefixLength).toUpperCase() !== label.toUpperCase()) return model;

  const boundary = model.charAt(prefixLength);
  if (boundary !== '' && boundary !== ' ' && boundary !== '-') return model;

  const rest = model.slice(prefixLength).replace(/^[\s-]+/, '');
  return rest === '' ? model : rest;
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
 * 여기의 규칙과 로고 그림 목록은 서로 다른 데이터입니다. 그림이 없는 id 를 돌려줘도
 * registry.hasLogo 가 거짓을 내놓고 layout 이 워드마크로 대체하므로, 상표 문제로 어느
 * 브랜드의 그림을 빼도 이 규칙은 그대로 두면 됩니다.
 */
export function brandId(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  const cleaned = clean(raw);
  if (cleaned === '') return undefined;
  return BRAND_ID_RULES.find((rule) => rule.pattern.test(cleaned))?.id;
}
