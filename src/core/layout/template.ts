import type { TemplateToken } from './types';

const TOKEN = /\{([A-Z_]+)\}/g;

/**
 * 표시 항목과 순서를 사용자가 문자열 하나로 정하게 합니다. 체크박스 여러 개보다
 * 다루기 쉽고, 값이 비었을 때 구분자가 덩그러니 남는 문제도 여기서 한 번에 해결합니다.
 */
export function renderTemplate(
  template: string,
  fields: Partial<Record<TemplateToken, string>>,
  divider: string,
): string {
  const pieces: string[] = [];
  let cursor = 0;

  // 템플릿을 `}` 로 쪼개면 토큰이 아닌 중괄호가 소실됩니다. 소문자 토큰
  // `{maker}` 가 `{maker` 로 나오는 식입니다. 토큰만 찾아 훑고 나머지는
  // 원문 그대로 두면 그런 일이 없습니다.
  for (const match of template.matchAll(TOKEN)) {
    const literal = template.slice(cursor, match.index);
    cursor = match.index + match[0].length;

    const value = fields[(match[1] ?? '') as TemplateToken];
    if (value === undefined || value.trim() === '') continue;

    const piece = `${literal}${value}`.trim();
    if (piece) pieces.push(piece);
  }

  const tail = template.slice(cursor).trim();
  if (tail) pieces.push(tail);

  const joiner = divider.trim() === '' ? ' ' : ` ${divider.trim()} `;
  return pieces.join(joiner);
}
