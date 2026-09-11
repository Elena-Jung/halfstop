import type { TemplateToken } from './types';

const TOKEN = /\{([A-Z_]+)\}/g;

/**
 * 표시 항목과 순서를 사용자가 문자열 하나로 정하게 합니다. 체크박스 여러 개보다
 * 다루기 쉽고, 값이 비었을 때 구분자가 덩그러니 남는 문제도 여기서 한 번에 해결합니다.
 *
 * 토큰과 토큰 사이에 적은 글자는 그 자체로 이음말이 됩니다. `{MAKER} {BODY}` 의
 * 공백처럼 적어 두면 그 글자로 두 값을 잇고, 아무것도 적지 않으면 지금까지처럼
 * 구분자로 잇습니다. 바로 앞 토큰의 값이 없으면 이 이음말도 짝을 잃어 함께
 * 사라지고, 뒤 토큰은 (구분자가 아니라) 단독으로 남습니다. 첫 토큰 앞의 글자만은
 * 이음말이 아니라 머리말이라 그 토큰과 운명을 함께합니다.
 */
export function renderTemplate(
  template: string,
  fields: Partial<Record<TemplateToken, string>>,
  divider: string,
): string {
  const tokens: { literal: string; value: string | undefined }[] = [];
  let cursor = 0;

  // 템플릿을 `}` 로 쪼개면 토큰이 아닌 중괄호가 소실됩니다. 소문자 토큰
  // `{maker}` 가 `{maker` 로 나오는 식입니다. 토큰만 찾아 훑고 나머지는
  // 원문 그대로 두면 그런 일이 없습니다.
  for (const match of template.matchAll(TOKEN)) {
    const literal = template.slice(cursor, match.index);
    cursor = match.index + match[0].length;

    const raw = fields[(match[1] ?? '') as TemplateToken];
    const value = raw !== undefined && raw.trim() !== '' ? raw : undefined;
    tokens.push({ literal, value });
  }

  const tail = template.slice(cursor).trim();
  const joiner = divider.trim() === '' ? ' ' : ` ${divider.trim()} `;

  let output = '';
  let hasOutput = false;
  let prevPresent = false;

  tokens.forEach((token, index) => {
    if (token.value === undefined) {
      prevPresent = false;
      return;
    }

    if (index === 0) {
      // 첫 토큰 앞의 글자는 머리말입니다. 이 토큰이 사라지면 함께 사라지고
      // (위에서 이미 걸러졌으므로) 남으면 값과 그대로 붙습니다.
      output = `${token.literal}${token.value}`.trim();
    } else if (prevPresent && token.literal !== '') {
      // 바로 앞 토큰이 살아 있고 그 사이에 적은 글자가 있으면 그 글자가
      // 이음말입니다. 구분자를 쓰지 않고 적은 글자를 그대로 씁니다.
      output += token.literal + token.value;
    } else if (hasOutput) {
      // 이을 글자가 없거나, 바로 앞 토큰이 비어 이음말이 짝을 잃은 자리는
      // 지금까지처럼 구분자로 잇습니다.
      output += joiner + token.value;
    } else {
      // 앞서 나온 값이 아직 없으면 이 값이 단독으로 시작합니다. 사이에 적은
      // 글자가 있어도 짝이 될 앞 토큰이 없으니 함께 버립니다.
      output = token.value;
    }

    hasOutput = true;
    prevPresent = true;
  });

  if (tail) {
    output = hasOutput ? output + joiner + tail : tail;
  }

  return output;
}
