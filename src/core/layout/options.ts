import type { OptionValue } from './types';

export type { OptionValue };

export type PresetOption =
  | { id: string; type: 'color'; default: string }
  | { id: string; type: 'number'; default: number; unit: 'u' }
  | { id: string; type: 'boolean'; default: boolean }
  | { id: string; type: 'select'; options: readonly string[]; default: string }
  | { id: string; type: 'range'; min: number; max: number; step: number; default: number }
  | { id: string; type: 'text'; default: string };

export function defaultValues(options: readonly PresetOption[]): Map<string, OptionValue> {
  return new Map(options.map((option) => [option.id, option.default]));
}

function coerce(option: PresetOption, raw: unknown): OptionValue | undefined {
  switch (option.type) {
    case 'color':
    case 'text':
      return typeof raw === 'string' ? raw : undefined;
    case 'boolean':
      return typeof raw === 'boolean' ? raw : undefined;
    case 'number':
      return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
    case 'select':
      return typeof raw === 'string' && option.options.includes(raw) ? raw : undefined;
    case 'range':
      if (typeof raw !== 'number' || !Number.isFinite(raw)) return undefined;
      return Math.min(option.max, Math.max(option.min, raw));
  }
}

/**
 * 저장된 설정은 사용자가 직접 고쳤을 수도, 예전 버전이 남긴 것일 수도 있습니다.
 * 선언에 없는 키와 타입이 맞지 않는 값은 조용히 버리고 기본값을 씁니다.
 */
export function mergeValues(
  options: readonly PresetOption[],
  stored: Record<string, unknown>,
): Map<string, OptionValue> {
  const values = defaultValues(options);
  for (const option of options) {
    if (!Object.hasOwn(stored, option.id)) continue;
    const coerced = coerce(option, stored[option.id]);
    if (coerced !== undefined) values.set(option.id, coerced);
  }
  return values;
}

function read(values: ReadonlyMap<string, OptionValue>, id: string): OptionValue {
  const value = values.get(id);
  if (value === undefined) throw new Error(`옵션 ${id}이 없습니다`);
  return value;
}

export function num(values: ReadonlyMap<string, OptionValue>, id: string): number {
  const value = read(values, id);
  if (typeof value !== 'number') throw new Error(`옵션 ${id}은 숫자가 아닙니다`);
  return value;
}

export function str(values: ReadonlyMap<string, OptionValue>, id: string): string {
  const value = read(values, id);
  if (typeof value !== 'string') throw new Error(`옵션 ${id}은 문자열이 아닙니다`);
  return value;
}

export function bool(values: ReadonlyMap<string, OptionValue>, id: string): boolean {
  const value = read(values, id);
  if (typeof value !== 'boolean') throw new Error(`옵션 ${id}은 불리언이 아닙니다`);
  return value;
}
