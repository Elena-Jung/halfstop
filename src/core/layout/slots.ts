import { renderTemplate } from './template';
import type { OptionValue, TemplateToken } from './types';

export type SlotName = 'PRIMARY' | 'SECONDARY';

export interface ResolvedSlot {
  main: string;
  sub: string;
}

/**
 * 옵션 키가 없으면 빈 문자열로 봅니다. 프리셋마다 쓰는 슬롯이 달라, 안 쓰는 슬롯의
 * 키를 굳이 넣어 두지 않기 때문입니다.
 */
function template(options: ReadonlyMap<string, OptionValue>, key: string): string {
  const value = options.get(key);
  return typeof value === 'string' ? value : '';
}

export function resolveSlot(
  options: ReadonlyMap<string, OptionValue>,
  slot: SlotName,
  fields: Partial<Record<TemplateToken, string>>,
  divider: string,
): ResolvedSlot {
  return {
    main: renderTemplate(template(options, `${slot}_MAIN`), fields, divider),
    sub: renderTemplate(template(options, `${slot}_SUB`), fields, divider),
  };
}
