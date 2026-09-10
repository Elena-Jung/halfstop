import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 치수의 유일한 출처인 src/assets/ui.css 를 node:fs 로 읽어 :root 의 치수 토큰을 뽑습니다.
 * src/ui/theme.test.ts 가 색에 하는 일과 같은 방식입니다. CSS 를 유일한 출처로 두면서도
 * 검사할 수 있는 길이 이것뿐입니다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(HERE, '..', 'assets', 'ui.css');
const CSS = readFileSync(CSS_PATH, 'utf-8');

/**
 * 쓸 수 있는 치수 단계 전부입니다. 이 표가 곧 규약이라 단계를 더하거나 값을 바꾸려면
 * 여기를 함께 고쳐야 하고, 그것이 의도입니다. 간격 이름의 숫자는 4px 의 배수 개수입니다.
 * 쓰는 자리가 없는 단계는 선언하지 않습니다.
 */
const EXPECTED_TOKENS: ReadonlyMap<string, string> = new Map([
  ['space-1', '4px'],
  ['space-2', '8px'],
  ['space-3', '12px'],
  ['space-4', '16px'],
  ['space-6', '24px'],
  ['radius-sm', '4px'],
  ['radius-md', '8px'],
  ['radius-lg', '12px'],
  ['text-sm', '12px'],
  ['text-md', '13px'],
  ['text-lg', '20px'],
]);

function readRootSizeTokens(): Map<string, string> {
  const block = /:root\s*\{([^}]*)\}/.exec(CSS);
  if (!block) throw new Error(':root 블록을 ui.css 에서 찾지 못했습니다');
  const tokens = new Map<string, string>();
  // 색 토큰은 16진수라 이 정규식에 걸리지 않습니다. 치수 토큰만 뽑힙니다.
  const pattern = /--([a-z0-9-]+):\s*(\d+px)\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(block[1]!)) !== null) {
    tokens.set(match[1]!, match[2]!);
  }
  return tokens;
}

function sortedEntries(tokens: ReadonlyMap<string, string>): Record<string, string> {
  return Object.fromEntries([...tokens].sort(([a], [b]) => a.localeCompare(b)));
}

describe('치수 토큰', () => {
  it(':root 의 치수 토큰이 규약과 정확히 같습니다', () => {
    expect(sortedEntries(readRootSizeTokens())).toEqual(sortedEntries(EXPECTED_TOKENS));
  });
});
