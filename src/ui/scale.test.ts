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

/*
 * 아래는 토큰 블록 밖에서 토큰 아닌 치수가 쓰이지 않는지 검사합니다.
 *
 * 주석과 :root, [data-theme='light'] 블록을 같은 줄 수만큼의 공백으로 덮어 줄 번호를
 * 지키면서 검사 대상에서 뺍니다. 정규식으로 선언만 훑으면 여러 줄에 걸친 값
 * (linear-gradient, box-shadow)의 중간 줄을 선택자로 잘못 읽습니다. 실제로 그렇게 읽어
 * ui.css 의 두 줄이 엉뚱한 선택자로 보고된 적이 있으므로, 중괄호 깊이를 세는 방식으로
 * 훑습니다.
 */
function blankKeepingLines(css: string, pattern: RegExp): string {
  return css.replace(pattern, (block) => block.replace(/[^\n]/g, ' '));
}

interface Declaration {
  /** 1부터 세는 줄 번호입니다. 실패 메시지에 그대로 보입니다. */
  readonly line: number;
  readonly selector: string;
  readonly property: string;
  readonly value: string;
}

function readDeclarations(): Declaration[] {
  let css = blankKeepingLines(CSS, /\/\*[\s\S]*?\*\//g);
  css = blankKeepingLines(css, /:root\s*\{[^}]*\}/);
  css = blankKeepingLines(css, /\[data-theme=(['"])light\1\]\s*\{[^}]*\}/);

  const out: Declaration[] = [];
  const stack: string[] = [];
  let selector = '';
  let buffer = '';
  let bufferLine = 1;
  let line = 1;
  let depth = 0;

  for (const ch of css) {
    if (ch === '{') {
      stack.push(selector);
      selector = buffer.trim().replace(/\s+/g, ' ');
      buffer = '';
      depth += 1;
    } else if (ch === '}') {
      selector = stack.pop() ?? '';
      buffer = '';
      depth -= 1;
    } else if (ch === ';') {
      const decl = /^([a-z-]+)\s*:\s*([\s\S]+)$/.exec(buffer.trim());
      if (decl && depth > 0) {
        out.push({
          line: bufferLine,
          selector,
          property: decl[1]!,
          value: decl[2]!.trim().replace(/\s+/g, ' '),
        });
      }
      buffer = '';
    } else {
      if (buffer.trim() === '' && !/\s/.test(ch)) bufferLine = line;
      buffer += ch;
    }
    if (ch === '\n') line += 1;
  }
  return out;
}

const SPACING_PROPERTIES: ReadonlySet<string> = new Set([
  'padding',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
  'margin',
  'margin-top',
  'margin-right',
  'margin-bottom',
  'margin-left',
  'gap',
  'row-gap',
  'column-gap',
]);

const SPACE_TOKEN = /^var\(--space-(1|2|3|4|6)\)$/;
const RADIUS_TOKEN = /^var\(--radius-(sm|md|lg)\)$/;
const TEXT_TOKEN = /^var\(--text-(sm|md|lg)\)$/;

/**
 * 치수 규칙에서 빼는 자리입니다. 여백이 아니라 기하 보정이라 단계로 표현할 수 없습니다.
 * 늘리려면 왜 단계로 못 쓰는지 이유를 함께 적으십시오.
 */
const EXEMPT: readonly (readonly [string, string])[] = [
  // 화면에서만 감추는 sr-only 기법의 일부입니다. 1px 상자를 레이아웃 밖으로 뺍니다.
  ['.sr-only', 'margin'],
  ['.hs-radio-input', 'margin'],
  // 손잡이를 트랙 가운데 맞추는 보정입니다. (손잡이 높이 - 트랙 높이) / 2 입니다.
  ['.hs-slider-input::-webkit-slider-thumb', 'margin-top'],
];

function isExempt(declaration: Declaration): boolean {
  return EXEMPT.some(
    ([selector, property]) =>
      declaration.selector === selector && declaration.property === property,
  );
}

function allowedPiece(property: string, piece: string): boolean {
  if (SPACING_PROPERTIES.has(property)) {
    return piece === '0' || piece === 'auto' || SPACE_TOKEN.test(piece);
  }
  if (property === 'border-radius') {
    return piece === '0' || piece === '50%' || RADIUS_TOKEN.test(piece);
  }
  if (property === 'font-size') return TEXT_TOKEN.test(piece);
  return true;
}

describe('토큰 밖의 치수', () => {
  const declarations = readDeclarations().filter(
    (declaration) =>
      (SPACING_PROPERTIES.has(declaration.property) ||
        declaration.property === 'border-radius' ||
        declaration.property === 'font-size') &&
      !isExempt(declaration),
  );

  it('검사할 선언을 실제로 찾았습니다', () => {
    // 파서가 조용히 아무것도 못 찾으면 아래 검사가 통과해 버립니다. 그 구멍을 막습니다.
    expect(declarations.length).toBeGreaterThan(50);
  });

  it('간격, 모서리, 글자 크기가 토큰만 씁니다', () => {
    const offenders = declarations
      .filter((declaration) =>
        declaration.value
          .split(' ')
          .some((piece) => !allowedPiece(declaration.property, piece)),
      )
      .map(
        (declaration) =>
          `ui.css:${declaration.line} ${declaration.selector} { ${declaration.property}: ${declaration.value} }`,
      );
    expect(offenders).toEqual([]);
  });
});
