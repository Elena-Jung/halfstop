import type { TemplateToken } from './types';

const SEGMENT = /^(.*?)\{([A-Z_]+)\}$/s;

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
  const chunks = template.split('}');

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i]!;
    const isLast = i === chunks.length - 1;

    if (isLast) {
      const tail = chunk.trim();
      if (tail) pieces.push(tail);
      continue;
    }

    const match = SEGMENT.exec(`${chunk}}`);
    if (!match) {
      // 여는 중괄호가 없는 조각입니다. 리터럴로 취급합니다.
      const literal = chunk.trim();
      if (literal) pieces.push(literal);
      continue;
    }

    const [, literal = '', token = ''] = match;
    const value = fields[token as TemplateToken];
    if (value === undefined || value.trim() === '') continue;

    pieces.push(`${literal}${value}`.trim());
  }

  const joiner = divider.trim() === '' ? ' ' : ` ${divider.trim()} `;
  return pieces.join(joiner);
}
