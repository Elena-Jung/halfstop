import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { contrastRatio } from './contrast';

/**
 * 색의 유일한 출처인 src/assets/ui.css 를 node:fs 로 읽어 :root(어두운 테마)와
 * [data-theme='light'](밝은 테마) 두 블록에서 토큰을 뽑고 대비를 계산합니다. CSS 를
 * 유일한 출처로 두면서도 검사할 수 있는 방법이고, src/core/coreBoundary.test.ts 가
 * 같은 방식을 씁니다.
 *
 * 두 블록을 모두 검사하는 것이 핵심입니다. :root 만 읽으면 밝은 테마는 검사를 전혀
 * 받지 않고 배포되어, 읽을 수 없는 글자가 그대로 실려 나갈 수 있습니다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const CSS_PATH = join(HERE, '..', 'assets', 'ui.css');
const CSS = readFileSync(CSS_PATH, 'utf-8');

type ThemeName = 'dark' | 'light';

// 각 테마가 CSS 안에서 뽑히는 블록입니다. 어두운 테마는 :root, 밝은 테마는
// [data-theme='light'] 이고 규칙은 src/ui/useTheme.ts 가 문서 루트에 올리는 속성과
// 같습니다.
const BLOCK_PATTERN: Record<ThemeName, RegExp> = {
  dark: /:root\s*\{([^}]*)\}/,
  light: /\[data-theme=(['"])light\1\]\s*\{([^}]*)\}/,
};

const BLOCK_LABEL: Record<ThemeName, string> = {
  dark: ':root',
  light: "[data-theme='light']",
};

function readBlockContent(theme: ThemeName): string {
  const match = BLOCK_PATTERN[theme].exec(CSS);
  if (!match) throw new Error(`${BLOCK_LABEL[theme]} 블록을 ui.css 에서 찾지 못했습니다`);
  // dark 는 캡처 그룹이 하나(블록 내용), light 는 둘(따옴표, 블록 내용)이라 항상
  // 마지막 캡처 그룹이 블록 내용입니다.
  const content = match[match.length - 1];
  if (content === undefined) throw new Error(`${BLOCK_LABEL[theme]} 블록 내용을 읽지 못했습니다`);
  return content;
}

function readThemeTokens(theme: ThemeName): Map<string, string> {
  const tokens = new Map<string, string>();
  const pattern = /--([a-z-]+):\s*(#[0-9a-fA-F]{6})\s*;/g;
  let match: RegExpExecArray | null;
  const content = readBlockContent(theme);
  while ((match = pattern.exec(content)) !== null) {
    tokens.set(match[1]!, match[2]!);
  }
  return tokens;
}

// 두 테마 블록에 실제로 선언되어 있어야 하는 색 토큰 전부입니다. 이 목록에서 하나를
// 지우면 아래 존재 확인이 실패합니다. 밝은 테마에서 하나라도 빠지면 그 자리만 어두운
// 값이 [data-theme='light'] 아래에서도 그대로 새어 나옵니다.
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

// 앞은 글자나 표시에 쓰는 색, 뒤는 그 색이 놓이는 배경입니다. 글자에 쓰는 짝은 4.5:1,
// 경계나 표시처럼 글자가 아닌 짝은 WCAG 비텍스트 기준인 3:1을 최소로 둡니다. 두 테마
// 모두 같은 여덟 짝을 검사합니다.
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

const THEMES: readonly ThemeName[] = ['dark', 'light'];

for (const theme of THEMES) {
  describe(`${BLOCK_LABEL[theme]} 테마 색 토큰`, () => {
    const tokens = readThemeTokens(theme);

    for (const name of REQUIRED_TOKENS) {
      it(`--${name} 토큰이 정의되어 있습니다`, () => {
        expect(tokens.has(name)).toBe(true);
      });
    }

    for (const [a, b, min] of PAIRS) {
      it(`--${a} 와 --${b} 의 명암비가 ${min}:1 이상입니다`, () => {
        const ratio = contrastRatio(requireToken(tokens, a), requireToken(tokens, b));
        expect(ratio).toBeGreaterThanOrEqual(min);
      });
    }
  });
}
