import { ko, type MessageKey } from './ko';

export type { MessageKey };
export { ko };

/**
 * 사전에서 문구를 찾아 중괄호 자리를 채웁니다. 값을 안 넘긴 자리는 그대로 둡니다. 조용히
 * 빈 문자열로 만들면 문구가 어색해진 것을 눈치채기 어렵습니다.
 */
export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  const template: string = ko[key];
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (whole, name: string) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : whole,
  );
}
