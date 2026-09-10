import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio } from './contrast';

/**
 * 색의 유일한 출처인 src/assets/ui.css 를 node:fs 로 읽어 :root 토큰을 뽑고 대비를
 * 계산합니다. CSS 를 유일한 출처로 두면서도 검사할 수 있는 방법이고,
 * src/core/coreBoundary.test.ts 가 같은 방식을 씁니다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(HERE, '..', 'assets', 'ui.css');

function readRootTokens(): Map<string, string> {
  const css = readFileSync(CSS_PATH, 'utf-8');
  const rootMatch = /:root\s*{([^}]*)}/.exec(css);
  if (!rootMatch) throw new Error(':root 블록을 ui.css 에서 찾지 못했습니다');
  const tokens = new Map<string, string>();
  const pattern = /--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(rootMatch[1]!)) !== null) {
    tokens.set(match[1]!, match[2]!);
  }
  return tokens;
}

// ui.css 의 :root 에 실제로 선언되어 있어야 하는 색 토큰 전부입니다. 이 목록에서 하나를
// 지우면 아래 존재 확인이 실패합니다.
const REQUIRED_TOKENS = [
  'bg',
  'surface',
  'surface-raised',
  'border',
  'text',
  'text-dim',
  'accent',
  'on-accent',
  'danger',
] as const;

function requireToken(tokens: ReadonlyMap<string, string>, name: string): string {
  const value = tokens.get(name);
  if (!value) throw new Error(`색 토큰이 없습니다: --${name}`);
  return value;
}

describe('테마 색 토큰', () => {
  const tokens = readRootTokens();

  for (const name of REQUIRED_TOKENS) {
    it(`--${name} 토큰이 정의되어 있습니다`, () => {
      expect(tokens.has(name)).toBe(true);
    });
  }

  // 앞은 글자나 표시에 쓰는 색, 뒤는 그 색이 놓이는 배경입니다. 글자에 쓰는 짝은 4.5:1,
  // 경계나 표시처럼 글자가 아닌 짝은 WCAG 비텍스트 기준인 3:1을 최소로 둡니다.
  const PAIRS: readonly [string, string, number][] = [
    ['text', 'bg', 4.5],
    ['text', 'surface', 4.5],
    ['text', 'surface-raised', 4.5],
    ['text-dim', 'bg', 4.5],
    ['text-dim', 'surface', 4.5],
    ['accent', 'bg', 3],
    ['on-accent', 'accent', 4.5],
    ['border', 'bg', 3],
  ];

  for (const [a, b, min] of PAIRS) {
    it(`--${a} 와 --${b} 의 명암비가 ${min}:1 이상입니다`, () => {
      const ratio = contrastRatio(requireToken(tokens, a), requireToken(tokens, b));
      expect(ratio).toBeGreaterThanOrEqual(min);
    });
  }
});
