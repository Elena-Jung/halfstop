# 화면을 하나로 묶기 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 치수를 토큰으로 묶어 검사로 붙잡고, 그 위에 화면 높이를 다 쓰는 편집기 셸을 지어 화면이 한 벌로 보이게 합니다.

**Architecture:** 색이 이미 `ui.css` 의 `:root` 토큰 하나에서 나오고 `theme.test.ts` 가 `node:fs` 로 그 파일을 읽어 검사합니다. 치수도 같은 구조를 씁니다. 토큰을 `:root` 에 세우고, `scale.test.ts` 가 같은 파일을 읽어 토큰 밖의 값을 거부합니다. 그다음 `.app` 을 `height: 100dvh` 의 세 줄 격자로 바꿔 헤더, 불러오기 줄, 본체를 쌓고 본체 안에서 미리보기, 설정, 레일이 선으로 만나게 합니다.

**Tech Stack:** React 19, TypeScript, Vite, Vitest(`environment: 'node'`), 순수 CSS(`src/assets/ui.css` 한 파일), lucide-react

## Global Constraints

스펙 `docs/superpowers/specs/2026-09-10-halfstop-visual-consistency-design.md` 가 정한 것과 이 저장소의 기존 규약입니다. **모든 작업의 요구사항에 이것이 암묵적으로 포함됩니다.**

- 치수 토큰은 정확히 이 열한 개입니다. `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--text-sm: 12px`, `--text-md: 13px`, `--text-lg: 20px`. 단계를 더하거나 값을 바꾸지 마십시오.
- 치수 토큰은 `:root` 에만 둡니다. 테마와 무관하므로 `[data-theme='light']` 에 넣지 마십시오.
- 색은 `ui.css` 의 색 토큰만 씁니다. 새 색 토큰을 더하면 두 테마 모두에 정의하고 `src/ui/theme.test.ts` 의 `REQUIRED_TOKENS` 와 `PAIRS` 에 짝을 추가하십시오. 글자면 4.5:1, 경계나 표시면 3:1 입니다.
- 안쪽 모서리는 바깥 모서리보다 한 단계 아래입니다. `--radius-md` 상자 안의 항목은 `--radius-sm` 입니다.
- 조작 요소는 `min-height: 32px` 이상, 아이콘만 있는 단추는 44px 이상입니다.
- `outline: none` 을 쓰지 마십시오. 전역 `:focus-visible` 을 물려받습니다.
- 입력을 감출 때 `display: none` 과 `visibility: hidden` 을 쓰지 마십시오. 초점을 받지 못합니다. `.hs-radio-input` 의 sr-only 방식을 쓰십시오.
- `display` 를 선언한 요소에 `[hidden]` 을 쓰려면 `[hidden] { display: none }` 을 따로 써야 합니다. 저작자 스타일시트가 원점 우선순위로 브라우저 기본 규칙을 덮습니다.
- 브라우저별 가상 요소(`::-webkit-*`, `::-moz-*`)를 한 선택자 목록에 묶지 마십시오. 한 브라우저가 모르는 이름이 섞이면 규칙 전체가 무효가 됩니다.
- 화면 문구를 하드코딩하지 마십시오. `t()` 로 가고 `src/i18n/ko.ts` 에 키를 더합니다.
- 한국어는 습니다체입니다. 해요체를 쓰지 않습니다. 하십시오체는 위반이 아닙니다. 코드 주석도 습니다체입니다.
- em-dash(U+2014)와 en-dash(U+2013)를 쓰지 마십시오.
- 커밋 메시지 제목은 명사구로 씁니다. 커밋 메시지 끝에 `Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>` 을 붙입니다.
- `git add -A` 를 쓰지 말고 경로를 지정하십시오. 다른 작업이 같은 저장소에서 동시에 돌 수 있습니다.
- 새 의존성을 추가하지 마십시오. 아이콘은 `lucide-react` 에서 고릅니다.
- `src/core/` 를 고치지 마십시오. 이 계획은 전부 화면의 일입니다.
- 테스트 환경은 `environment: 'node'` 이고 `include: ['src/**/*.test.ts']` 입니다. 화면 렌더 테스트(`.tsx` 테스트)를 만들지 마십시오. 수집조차 되지 않습니다.
- 임시 시험용 파일을 프로젝트 디렉터리에 남기지 마십시오. 스크래치패드를 쓰십시오.

---

## 파일 구조

| 파일 | 책임 | 어느 작업 |
|---|---|---|
| `src/assets/ui.css` | 색과 치수의 유일한 출처, 모든 화면 스타일 | 1, 2, 4, 5, 6 |
| `src/ui/scale.test.ts` | 치수 토큰 규약과 토큰 밖 값 금지를 검사 | 1(신규), 2(확장) |
| `docs/css-style.md` | 사람과 작업자가 읽는 CSS 규약 | 3(신규) |
| `AGENTS.md` | 문서 목록에 위 지침을 연결 | 3 |
| `src/ui/controls/Listbox.tsx` | 펼친 목록을 포털로 띄워 스크롤 칸에 잘리지 않게 함 | 4 |
| `src/ui/App.tsx` | 셸 마크업, 불러오기 줄, 빈 상태 | 5, 6 |
| `src/i18n/ko.ts` | 빈 상태 문구 | 6 |

## 작업 순서와 병렬

**작업 3은 문서만 건드리므로 아무 때나 병렬로 돌려도 됩니다.**

나머지 다섯은 전부 `src/assets/ui.css` 를 건드리므로 **반드시 1 → 2 → 4 → 5 → 6 순서로 하나씩** 합니다. 특히 작업 4는 작업 5보다 먼저여야 합니다. 작업 5가 설정 칸을 스크롤 컨테이너로 만드는 순간, 포털을 안 쓰는 목록은 칸 가장자리에서 잘립니다.

---

### Task 1: 치수 토큰과 토큰 규약 검사

**Files:**
- Create: `src/ui/scale.test.ts`
- Modify: `src/assets/ui.css` (`:root` 블록)

**Interfaces:**
- Consumes: 없음
- Produces: `:root` 의 치수 토큰 열한 개. 뒤의 모든 작업이 `var(--space-*)`, `var(--radius-*)`, `var(--text-*)` 로 이 값을 씁니다.

- [ ] **Step 1: 검사를 먼저 만듭니다**

`src/ui/scale.test.ts` 를 새로 만들고 아래를 그대로 넣으십시오.

```ts
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
```

- [ ] **Step 2: 검사가 실패하는 것을 확인합니다**

Run: `npx vitest run src/ui/scale.test.ts`

Expected: FAIL. 받은 값이 `{}` 이고 기대값이 열한 개인 차이를 보여 줍니다. 아직 토큰이 없기 때문입니다.

- [ ] **Step 3: 토큰을 선언합니다**

`src/assets/ui.css` 의 `:root` 블록 안, 색 토큰 뒤에 아래를 더하십시오. 닫는 중괄호 앞입니다.

```css
  /*
   * 치수 토큰입니다. 색과 달리 테마에 따라 달라지지 않으므로 [data-theme='light'] 에는
   * 넣지 않습니다. 간격 이름의 숫자는 4px 의 배수 개수입니다(space-3 = 12px).
   * src/ui/scale.test.ts 가 이 목록과 정확히 같은지, 그리고 CSS 어디에도 이 밖의 값이
   * 쓰이지 않는지 검사합니다.
   */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;

  /* 안쪽 모서리는 바깥 모서리보다 한 단계 아래를 씁니다. */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  --text-sm: 12px;
  --text-md: 13px;
  --text-lg: 20px;
```

- [ ] **Step 4: 검사가 통과하는 것을 확인합니다**

Run: `npx vitest run src/ui/scale.test.ts src/ui/theme.test.ts`

Expected: PASS. `theme.test.ts` 도 함께 통과해야 합니다. 색 토큰 정규식은 `#` 뒤 6자리만 잡으므로 새 치수 토큰이 같은 블록에 있어도 무시합니다. 여기서 `theme.test.ts` 가 깨지면 색 토큰을 건드린 것이니 되돌리십시오.

- [ ] **Step 5: 전체 검사**

Run: `npx tsc --noEmit && npm test`

Expected: 모두 통과.

- [ ] **Step 6: 커밋**

```bash
git add src/assets/ui.css src/ui/scale.test.ts
git commit -m "$(cat <<'EOF'
치수 토큰 선언과 토큰 규약 검사 추가

ui.css 의 간격이 아홉 가지, 모서리가 일곱 가지 값으로 규칙 없이 섞여 있었습니다.
색만 토큰이고 치수는 작업자마다 눈대중이었던 것이 원인입니다. 간격 다섯 단계,
모서리 세 단계, 글자 세 단계를 :root 에 선언하고, theme.test.ts 와 같은 방식으로
ui.css 를 node:fs 로 읽어 이 목록과 정확히 같은지 검사합니다.

단계를 더하거나 값을 바꾸려면 검사의 EXPECTED_TOKENS 도 함께 고쳐야 합니다.
규약을 조용히 넓히지 못하게 하려는 것이므로 의도된 마찰입니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: 어긋난 치수 값을 토큰으로 옮기기

**Files:**
- Modify: `src/ui/scale.test.ts` (검사 추가)
- Modify: `src/assets/ui.css` (전역)

**Interfaces:**
- Consumes: Task 1 의 `:root` 치수 토큰
- Produces: `ui.css` 안의 모든 `padding*`, `margin*`, `gap`, `row-gap`, `column-gap`, `border-radius`, `font-size` 가 토큰만 씀. 뒤의 작업이 새 규칙을 쓸 때 지켜야 하는 상태입니다.

- [ ] **Step 1: 검사를 먼저 추가합니다**

`src/ui/scale.test.ts` 의 맨 끝(마지막 `describe` 블록 뒤)에 아래를 이어 붙이십시오. 위쪽 import 와 `CSS` 상수를 그대로 씁니다.

```ts
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
```

- [ ] **Step 2: 검사가 실패하며 고칠 자리를 전부 알려 주는 것을 확인합니다**

Run: `npx vitest run src/ui/scale.test.ts`

Expected: FAIL. `간격, 모서리, 글자 크기가 토큰만 씁니다` 가 80개 항목을 줄 번호와 선택자와 함께 나열합니다. **이 목록이 곧 할 일 목록입니다.** 하나씩 지워 나가십시오.

- [ ] **Step 3: 값을 토큰으로 바꿉니다**

**기계적인 것.** 값이 아래와 같으면 무조건 이 토큰입니다. 판단이 필요 없습니다.

| 속성 계열 | 값 | 토큰 |
|---|---|---|
| 간격 | `4px` | `var(--space-1)` |
| 간격 | `8px` | `var(--space-2)` |
| 간격 | `12px` | `var(--space-3)` |
| 간격 | `16px` | `var(--space-4)` |
| 간격 | `24px` | `var(--space-6)` |
| `border-radius` | `4px` | `var(--radius-sm)` |
| `border-radius` | `8px` | `var(--radius-md)` |
| `border-radius` | `12px` | `var(--radius-lg)` |
| `font-size` | `12px` | `var(--text-sm)` |
| `font-size` | `13px` | `var(--text-md)` |
| `font-size` | `20px` | `var(--text-lg)` |

`0`, `auto`, `50%` 는 그대로 둡니다.

**판단이 필요한 것.** 단계에 없는 값입니다. 아래 표가 전부이고, 이대로 하십시오. 다르게 고르지 마십시오.

| 선택자 | 지금 | 바꿈 | 왜 |
|---|---|---|---|
| `.intake[data-compact='true']` | `padding: 10px 12px` | `var(--space-2) var(--space-3)` | 조작 요소 안쪽은 8/12 로 통일 |
| `.intake[data-compact='true']` | `margin-bottom: 10px` | `var(--space-3)` | 구역 사이 |
| `.intake-row` | `gap: 10px 12px` | `var(--space-3)` | 두 값이 같아지므로 한 값으로 씁니다 |
| `.intake[data-compact='true'] .status-line` | `margin: 6px 0 0` | `var(--space-2) 0 0` | |
| `.preset-list` | `gap: 6px` | `var(--space-2)` | 같은 묶음 안 항목 사이 |
| `.preset-item` | `padding: 8px 10px` | `var(--space-2) var(--space-3)` | 8/12 통일 |
| `.photo-strip` | `gap: 10px` | `var(--space-3)` | 단추와 썸네일 묶음 사이라 묶음 사이입니다 |
| `.photo-select-all` | `padding: 4px 10px` | `var(--space-1) var(--space-3)` | 작은 보조 단추라 세로는 1 단계를 유지합니다 |
| `.photo-select-all` | `border-radius: 6px` | `var(--radius-md)` | 단추는 md 입니다 |
| `.photo-grid` | `padding-bottom: 2px` | `var(--space-1)` | |
| `.intake-footer` | `gap: 10px` | `var(--space-3)` | |
| `.file-picker` | `padding: 6px 14px` | `var(--space-2) var(--space-3)` | 8/12 통일 |
| `.hs-listbox-trigger` | `padding: 6px 10px` | `var(--space-2) var(--space-3)` | 8/12 통일 |
| `.hs-listbox-option` | `padding: 6px 8px` | `var(--space-2) var(--space-3)` | 8/12 통일 |
| `.hs-listbox-option` | `border-radius: 6px` | `var(--radius-sm)` | `--radius-md` 목록 안쪽이라 한 단계 아래 |
| `.hs-text-input` | `padding: 6px 10px` | `var(--space-2) var(--space-3)` | 8/12 통일 |
| `.hs-number-input` | `padding: 0 4px` | `0 var(--space-1)` | |
| `.hs-number-unit` | `padding: 0 8px` | `0 var(--space-2)` | |
| `.hs-slider-input::-webkit-slider-runnable-track` | `border-radius: 2px` | `var(--radius-sm)` | |
| `.hs-slider-input::-moz-range-track` | `border-radius: 2px` | `var(--radius-sm)` | |
| `.hs-slider-input::-moz-range-progress` | `border-radius: 2px` | `var(--radius-sm)` | |
| `.hs-colorpicker-panel` | `gap: 10px` | `var(--space-3)` | 창 안 구역 사이 |
| `.hs-colorpicker-close` | `border-radius: 6px` | `var(--radius-md)` | 단추는 md 입니다 |
| `.hs-drop-overlay` | `font-size: 18px` | `var(--text-lg)` | |
| `.hs-button` | `padding: 8px 16px` | `var(--space-2) var(--space-4)` | 주 단추는 가로를 넓게 유지합니다 |

**`.hs-slider-input::-webkit-slider-thumb` 의 `margin-top: -6px` 은 그대로 두십시오.** 검사가 이미 빼고 있습니다. 트랙 가운데 맞추는 기하 보정입니다.

**모양이 바뀌는 것을 예상하십시오.** 카드와 목록 항목이 4px 씩 높아지고, 목록 항목의 모서리가 6에서 4로 줄고, 파일 고르기 단추가 가로로 4px 좁아집니다. 사용자가 1:1 시안을 보고 정한 변화입니다.

- [ ] **Step 4: 검사가 통과하는 것을 확인합니다**

Run: `npx vitest run src/ui/scale.test.ts`

Expected: PASS. `offenders` 가 빈 배열입니다.

- [ ] **Step 5: 전체 검사와 빌드**

Run: `npx tsc --noEmit && npm test && npm run build`

Expected: 모두 통과.

- [ ] **Step 6: 눈으로 확인합니다**

`npm run dev` 로 띄우고 두 테마에서 봅니다. 사진 한 장을 넣고 레일의 네 칸을 모두 열어 보십시오.

1. 프리셋 카드가 서로 겹치거나 붙지 않았는지.
2. 서체 목록을 열어 항목의 모서리가 목록 바깥 모서리와 겹쳐 보이지 않는지.
3. 색 고르기 창을 열어 안쪽 여백이 무너지지 않았는지.
4. 숫자칸의 증감 단추와 단위가 한 줄에 그대로 있는지.

- [ ] **Step 7: 커밋**

```bash
git add src/assets/ui.css src/ui/scale.test.ts
git commit -m "$(cat <<'EOF'
어긋난 치수 값을 토큰으로 이동

ui.css 의 padding, margin, gap, border-radius, font-size 80곳이 단계 밖의 값을
쓰고 있었습니다. 전부 치수 토큰으로 옮기고, 토큰 밖의 값을 거부하는 검사를
scale.test.ts 에 추가했습니다.

검사는 주석과 두 토큰 블록을 줄 수를 지키며 공백으로 덮은 뒤 중괄호 깊이를 세어
선언을 훑습니다. 정규식으로 줄 단위로 훑으면 여러 줄에 걸친 linear-gradient 와
box-shadow 값의 중간 줄을 선택자로 잘못 읽습니다.

조작 요소의 안쪽 여백을 8/12 하나로 통일했고, 목록 항목의 모서리를 6px 에서
radius-sm 으로 낮춰 바깥 radius-md 와 겹쳐 보이지 않게 했습니다. 그 결과 카드와
목록 항목이 4px 씩 높아집니다. 사용자가 1:1 시안을 보고 정한 변화입니다.

sr-only 의 margin: -1px 과 슬라이더 손잡이의 margin-top: -6px 은 여백이 아니라
기하 보정이라 EXEMPT 목록에 이유와 함께 뺐습니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: CSS 작업 지침 문서

**이 작업은 문서만 건드리므로 다른 작업과 병렬로 돌려도 됩니다.**

**Files:**
- Create: `docs/css-style.md`
- Modify: `AGENTS.md` (`<documents>` 블록의 표, `<conventions>` 블록)

**Interfaces:**
- Consumes: 없음. Task 1 과 2 가 아직 안 끝났어도 됩니다. 이 문서는 **정해진 규약**을 적는 것이지 코드 상태를 적는 것이 아닙니다.
- Produces: `docs/css-style.md`. 앞으로의 작업 지시서가 "반드시 지킬 것" 여섯 줄을 반복하는 대신 이 문서를 가리킵니다.

- [ ] **Step 1: `docs/css-style.md` 를 씁니다**

아래 목차를 모두 채우십시오. **규칙마다 왜 그런지를 함께 적으십시오.** 이유 없는 규칙은 다음 작업자가 상황이 다르다고 판단해 버립니다. `AGENTS.md` 가 같은 방식으로 쓰여 있으니 문체와 밀도를 맞추십시오.

1. **이 문서가 있는 이유.** 여섯 작업이 각자 CSS 를 썼고 공유 체계가 없어 간격 아홉 가지, 모서리 일곱 가지가 섞였습니다. 색만 토큰이었습니다.
2. **색.** `ui.css` 의 색 토큰만 씁니다. 새 토큰은 두 테마 모두에 정의하고 `src/ui/theme.test.ts` 의 `REQUIRED_TOKENS` 와 `PAIRS` 에 짝을 더합니다. 글자 4.5:1, 경계나 표시 3:1. 값은 `#` 뒤 정확히 6자리 16진수여야 검사에 잡힙니다. `#fff` 와 `rgb()` 는 조용히 빠집니다.
3. **치수.** 토큰 열한 개를 표로 싣습니다. `--space-1: 4px`, `--space-2: 8px`, `--space-3: 12px`, `--space-4: 16px`, `--space-6: 24px`, `--radius-sm: 4px`, `--radius-md: 8px`, `--radius-lg: 12px`, `--text-sm: 12px`, `--text-md: 13px`, `--text-lg: 20px`. `src/ui/scale.test.ts` 가 검사합니다. **쓰는 자리가 없는 단계는 선언하지 않습니다.**
4. **어느 단계를 어디에.** 조작 요소 안쪽 `--space-2 / --space-3`(세로/가로). 같은 묶음 안 항목 사이 `--space-2`. 묶음과 묶음 사이 `--space-3`. 구역 안쪽 `--space-4`. **안쪽 모서리는 바깥 모서리보다 한 단계 아래**입니다. `--radius-md` 상자 안의 항목은 `--radius-sm` 입니다. 같으면 두 모서리가 겹쳐 보입니다.
5. **크기.** 조작 요소 `min-height: 32px` 이상, 아이콘만 있는 단추 44px 이상. WCAG 2.5.8 의 24x24 를 넉넉히 넘깁니다.
6. **상태는 `data-*` 로.** React 가 찍고 CSS 가 읽습니다. `:checked` 와 `:has()` 로 상태를 읽지 않습니다. 실제 입력을 sr-only 로 감추는 구조라 `:checked` 가 보이는 요소에 닿지 않습니다.
7. **감추기.** `display: none` 과 `visibility: hidden` 은 초점을 잃습니다. `.hs-radio-input` 의 sr-only 방식을 쓰십시오. **`display` 를 선언한 요소에 `[hidden]` 을 쓰려면 `[hidden] { display: none }` 을 따로 써야 합니다.** 저작자 스타일시트가 원점 우선순위로 브라우저 기본 규칙을 덮습니다. `.settings-panel` 이 실제로 이것에 걸려 감춘 패널이 겹쳐 보였습니다.
8. **초점.** `outline: none` 금지. 전역 `:focus-visible` 을 물려받습니다. 입력을 감춘 자리는 `.hs-radio-input:focus-visible + .hs-radio-box` 처럼 보이는 표시자에 옮겨 그립니다.
9. **구분선.** 선택 표시에 `border-color` 를 쓰는 요소의 구분선은 `border` 가 아니라 `box-shadow` 로 그립니다. 두 규칙이 같은 속성을 놓고 다투지 않게 하려는 것입니다. `.rail-tab` 이 그 예입니다.
10. **인라인 `style`.** 실행 중에 계산되는 값만 넣습니다. 색 견본의 배경색, 색 판 손잡이의 위치, 포털로 띄운 목록의 좌표가 그것입니다. 그 밖의 것은 `ui.css` 로 갑니다.
11. **브라우저별 가상 요소.** `::-webkit-*` 와 `::-moz-*` 를 한 선택자 목록에 묶지 마십시오. 한 브라우저가 모르는 이름이 섞이면 규칙 전체가 무효가 됩니다. 규칙을 따로 씁니다.
12. **눈으로 확인할 것.** 두 테마. 767px 아래. 키보드 초점 한 바퀴. 설정 칸 스크롤과 펼친 목록. **화면 마크업을 지키는 자동 검사가 없습니다**(테스트 환경이 `node` 라 렌더 테스트가 없습니다). 사람이 보는 것이 유일한 안전망이므로 형식적으로 하지 마십시오.

- [ ] **Step 2: `AGENTS.md` 에 연결합니다**

`<documents>` 블록의 `## 저장소에 있는 문서` 표에 한 줄을 더하십시오. `AGENTS.md` 다음 줄이 자연스럽습니다.

```markdown
| `docs/css-style.md` | CSS 규약. 색과 치수 토큰, 어느 단계를 어디에, 감추기와 초점, 눈으로 확인할 것 |
```

그리고 `<conventions>` 블록 끝에 아래 절을 더하십시오.

```markdown
## CSS

`docs/css-style.md` 를 읽으십시오. 색과 치수는 `src/assets/ui.css` 의 토큰이 유일한
출처이고 `src/ui/theme.test.ts` 와 `src/ui/scale.test.ts` 가 그것을 검사합니다.
```

- [ ] **Step 3: 검사**

Run: `npx tsc --noEmit && npm test`

Expected: 모두 통과. 이 작업은 코드를 안 건드리므로 아무것도 바뀌지 않아야 합니다.

- [ ] **Step 4: 문체 확인**

Run: `grep -nP '[\x{2013}\x{2014}]' docs/css-style.md AGENTS.md`

Expected: 아무것도 안 나옵니다. em-dash 와 en-dash 가 없어야 합니다.

Run: `grep -nE '(아요|어요|여요|예요|에요|해요|세요|게요|까요|네요|죠)([[:space:].,!?]|$)' docs/css-style.md`

Expected: 아무것도 안 나옵니다. 나오면 해요체이니 습니다체나 하십시오체로 고치십시오. `하십시오` 는 위반이 아닙니다.

- [ ] **Step 5: 커밋**

```bash
git add docs/css-style.md AGENTS.md
git commit -m "$(cat <<'EOF'
CSS 작업 지침 문서 추가

여섯 작업이 각자 CSS 를 쓰면서 공유 체계가 없어 간격 아홉 가지, 모서리 일곱 가지
값이 섞였습니다. 색과 치수 토큰, 어느 단계를 어디에 쓰는지, 상태 전달과 감추기와
초점, 구분선을 box-shadow 로 그리는 이유, 눈으로 확인할 것을 한곳에 모았습니다.

규칙마다 왜 그런지를 함께 적었습니다. 이유 없는 규칙은 다음 작업자가 상황이
다르다고 판단해 버립니다. AGENTS.md 의 문서 목록과 규약 절에서 이 문서를
가리키게 했습니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: 펼친 목록을 포털로 띄우기

**Files:**
- Modify: `src/ui/controls/Listbox.tsx`
- Modify: `src/assets/ui.css` (`.hs-listbox-list` 와 `.hs-listbox-list[data-placement='top']`)

**Interfaces:**
- Consumes: Task 1 의 치수 토큰
- Produces: `Listbox` 가 목록을 `document.body` 에 포털로 띄웁니다. Task 5 가 설정 칸을 스크롤 컨테이너로 만들어도 목록이 잘리지 않습니다.

**왜 지금 하는가.** 지금은 설정 칸이 스크롤되지 않아 문제가 안 보입니다. Task 5 가 `overflow-y: auto` 를 주는 순간 스크롤 컨테이너가 절대 위치 자손을 자르고, 서체 목록이 칸 가장자리에서 잘립니다. 이것을 피할 CSS 는 없습니다. **Task 5 보다 먼저 해야 합니다.**

- [ ] **Step 1: 실패하는 테스트를 먼저 씁니다**

`src/ui/controls/listboxLogic.test.ts` 에 아래를 더하십시오. 맨 위 import 목록에 `listPosition` 을 함께 더합니다. 아직 그 함수가 없으므로 이 파일은 컴파일되지 않습니다. 그것이 이 단계의 목적입니다.

세 기댓값의 산수를 여기에 적어 둡니다. 옮기기 전에 직접 확인하십시오.

| 경우 | `spaceBelow` | `listHeight + gap` | 아래가 모자람 | 위 자리 `trigger.top` | 뒤집나 | `top` |
|---|---|---|---|---|---|---|
| 넉넉함 | 900 - 232 = 668 | 224 | 아니오 | | 아니오 | 232 + 4 = 236 |
| 뒤집음 | 400 - 332 = 68 | 224 | 예 | 300 > 224 | 예 | 300 - 220 - 4 = 76 |
| 둘 다 모자람 | 400 - 42 = 358 | 504 | 예 | 10 > 504 아님 | 아니오 | 42 + 4 = 46 |

```ts
describe('listPosition', () => {
  it('아래에 자리가 넉넉하면 트리거 아래에 둡니다', () => {
    expect(listPosition({ left: 100, top: 200, bottom: 232, width: 280 }, 220, 900, 4)).toEqual({
      left: 100,
      top: 236,
      width: 280,
      placement: 'bottom',
    });
  });

  it('아래가 모자라고 위에 자리가 있으면 위로 뒤집습니다', () => {
    expect(listPosition({ left: 100, top: 300, bottom: 332, width: 280 }, 220, 400, 4)).toEqual({
      left: 100,
      top: 76,
      width: 280,
      placement: 'top',
    });
  });

  it('위아래 모두 모자라면 뒤집지 않습니다. 뒤집어도 나아지지 않습니다', () => {
    expect(listPosition({ left: 0, top: 10, bottom: 42, width: 280 }, 500, 400, 4)).toEqual({
      left: 0,
      top: 46,
      width: 280,
      placement: 'bottom',
    });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는 것을 확인합니다**

Run: `npx vitest run src/ui/controls/listboxLogic.test.ts`

Expected: FAIL. `listPosition` 을 `./listboxLogic` 에서 내보내지 않는다는 오류입니다.

- [ ] **Step 3: 위치 계산 함수를 만듭니다**

`src/ui/controls/listboxLogic.ts` 에 아래를 더하십시오. 이 파일에 이미 `initialActiveIndex`, `typeaheadIndex`, `wrapIndex` 가 있습니다.

```ts
/** 포털로 띄운 목록의 화면 좌표입니다. position: fixed 기준입니다. */
export interface ListPosition {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly placement: 'bottom' | 'top';
}

/**
 * 트리거 아래에 띄우되, 아래가 모자라고 위에 자리가 있을 때만 위로 뒤집습니다. 양쪽 다
 * 모자라면 뒤집어도 나아지지 않으므로 아래에 둡니다. 목록을 body 로 포털했으므로 좌표를
 * 직접 계산해야 하고, 그 계산을 순수 함수로 빼서 검사합니다.
 */
export function listPosition(
  trigger: { left: number; top: number; bottom: number; width: number },
  listHeight: number,
  viewportHeight: number,
  gap: number,
): ListPosition {
  const needed = listHeight + gap;
  const flip = viewportHeight - trigger.bottom < needed && trigger.top > needed;
  return {
    left: trigger.left,
    top: flip ? trigger.top - listHeight - gap : trigger.bottom + gap,
    width: trigger.width,
    placement: flip ? 'top' : 'bottom',
  };
}
```

- [ ] **Step 4: 테스트가 통과하는 것을 확인합니다**

Run: `npx vitest run src/ui/controls/listboxLogic.test.ts`

Expected: PASS. 새로 더한 셋을 포함해 이 파일의 테스트가 모두 통과합니다.

- [ ] **Step 5: `Listbox.tsx` 가 포털을 쓰게 고칩니다**

바꿀 것은 넷입니다.

첫째, import 에 `createPortal` 과 `listPosition` 을 더합니다.

```ts
import { createPortal } from 'react-dom';
import { initialActiveIndex, listPosition, typeaheadIndex, wrapIndex, type ListPosition } from './listboxLogic';
```

둘째, `placement` 상태를 `position` 상태로 바꿉니다.

```ts
const [position, setPosition] = useState<ListPosition | null>(null);
```

셋째, `useLayoutEffect` 를 아래로 바꿉니다. 트리거 좌표를 재고, 설정 칸이 스크롤되거나 창 크기가 바뀌면 닫습니다.

```ts
  /**
   * 목록을 body 에 포털로 띄우므로 좌표를 직접 계산합니다. 설정 칸이 스크롤 컨테이너라
   * 목록을 그 안에 두면 칸 가장자리에서 잘리고, 그것을 피할 CSS 가 없습니다.
   *
   * 띄운 뒤 트리거가 움직이면 좌표가 틀어지므로 스크롤과 창 크기 변화에서는 다시
   * 계산하지 않고 닫습니다. 열려 있는 동안 따라다니게 만들면 스크롤할 때마다 다시
   * 그려야 하는데, 목록이 열린 채로 스크롤하는 일이 드물어 값어치가 없습니다.
   * 스크롤은 캡처 단계로 듣습니다. 설정 칸처럼 안쪽에서 나는 스크롤은 거품이 올라오지
   * 않습니다.
   */
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !listRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const listHeight = listRef.current.getBoundingClientRect().height;
    setPosition(
      listPosition(
        { left: rect.left, top: rect.top, bottom: rect.bottom, width: rect.width },
        listHeight,
        window.innerHeight,
        LIST_GAP,
      ),
    );
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onMoved = () => close();
    window.addEventListener('scroll', onMoved, true);
    window.addEventListener('resize', onMoved);
    return () => {
      window.removeEventListener('scroll', onMoved, true);
      window.removeEventListener('resize', onMoved);
    };
  }, [open]);
```

파일 위쪽 `TYPEAHEAD_RESET_MS` 옆에 상수를 더합니다.

```ts
/** 트리거와 펼친 목록 사이 간격입니다. ui.css 의 --space-1 과 같아야 합니다. */
const LIST_GAP = 4;
```

넷째, `<ul>` 을 포털로 감쌉니다. 반환문의 `<ul>` 전체를 아래로 바꾸십시오.

```tsx
      {createPortal(
        <ul
          id={listboxId}
          role="listbox"
          aria-label={label}
          ref={listRef}
          className="hs-listbox-list"
          data-placement={position?.placement ?? 'bottom'}
          hidden={!open}
          style={
            position
              ? { left: `${position.left}px`, top: `${position.top}px`, width: `${position.width}px` }
              : undefined
          }
        >
          {options.map((option, index) => (
            <li
              key={option.value}
              id={optionId(index)}
              role="option"
              aria-selected={option.value === value}
              data-selected={option.value === value}
              data-active={index === activeIndex}
              className="hs-listbox-option"
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => commit(index)}
            >
              {renderOption ? renderOption(option) : option.label}
            </li>
          ))}
        </ul>,
        document.body,
      )}
```

**바깥 클릭 판정을 반드시 고치십시오.** 지금은 `rootRef.current?.contains(event.target)` 만 봅니다. 목록이 포털로 `body` 에 있으므로 항목을 누르면 `rootRef` 밖이라 **고르기 전에 닫혀 버립니다.** 아래로 바꾸십시오.

```ts
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      // 목록은 포털로 body 에 있어 rootRef 밖입니다. 두 곳을 모두 봐야 항목을 누를 때
      // 닫히지 않습니다.
      if (rootRef.current?.contains(target)) return;
      if (listRef.current?.contains(target)) return;
      close();
    };
```

- [ ] **Step 6: CSS 를 `fixed` 로 바꿉니다**

`.hs-listbox-list` 규칙을 아래로 바꾸십시오. `position`, `left`, `right`, `top`, `margin` 이 달라집니다. 좌표는 컴포넌트가 인라인으로 넣습니다.

```css
/*
 * 설정 칸이 스크롤 컨테이너라 목록을 그 안에 두면 칸 가장자리에서 잘립니다. body 로
 * 포털해 띄우고 좌표는 Listbox.tsx 가 트리거를 재서 인라인으로 넣습니다. 실행 중에
 * 계산되는 값이라 인라인 style 을 쓰는 것이 맞는 자리입니다.
 */
.hs-listbox-list {
  position: fixed;
  z-index: 20;
  margin: 0;
  padding: var(--space-1);
  list-style: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: var(--surface-raised);
  max-height: 220px;
  overflow-y: auto;
  box-shadow: 0 4px 12px color-mix(in srgb, var(--bg) 70%, transparent);
}
```

`.hs-listbox-list[data-placement='top']` 규칙 전체를 **지우십시오.** 뒤집기는 이제 인라인 `top` 이 정합니다. `data-placement` 속성 자체는 남겨 두십시오. 어느 쪽으로 띄웠는지 눈으로 확인할 때 씁니다.

- [ ] **Step 7: 검사**

Run: `npx tsc --noEmit && npm test && npm run build`

Expected: 모두 통과. `scale.test.ts` 도 통과해야 합니다. 새 규칙이 토큰만 씁니다.

- [ ] **Step 8: 눈으로 확인합니다**

`npm run dev` 로 띄우고 사진을 한 장 넣은 뒤 프레임 칸에서 서체 목록을 여십시오.

1. 목록이 트리거 바로 아래에 트리거와 같은 폭으로 뜨는지.
2. 항목을 마우스로 눌러 실제로 골라지는지. **이것이 바깥 클릭 판정을 고쳤는지 보는 검사입니다.**
3. 키보드로 열고(`ArrowDown`) 이동하고 `Enter` 로 고르고 `Escape` 로 닫는 것이 모두 되는지.
4. 창을 세로로 줄여 트리거가 화면 아래쪽에 오게 한 뒤 열어 위로 뒤집히는지.
5. 목록을 연 채로 창 크기를 바꾸면 닫히는지.
6. 두 테마 모두에서 목록이 읽히는지.

- [ ] **Step 9: 커밋**

```bash
git add src/ui/controls/Listbox.tsx src/ui/controls/listboxLogic.ts src/ui/controls/listboxLogic.test.ts src/assets/ui.css
git commit -m "$(cat <<'EOF'
펼친 목록을 body 포털로 이동

다음 작업이 설정 칸에 overflow-y: auto 를 주면 스크롤 컨테이너가 절대 위치 자손을
잘라 서체 목록이 칸 가장자리에서 잘립니다. 이것을 피할 CSS 가 없어 목록을 body 로
포털하고 좌표를 직접 계산합니다.

좌표 계산을 listPosition 순수 함수로 빼서 검사했습니다. 아래 자리가 모자라고 위에
자리가 있을 때만 뒤집고, 양쪽 다 모자라면 아래에 둡니다.

바깥 클릭 판정을 함께 고쳤습니다. 목록이 rootRef 밖으로 나갔으므로 항목을 누르면
고르기 전에 닫혀 버립니다. 목록 ref 도 함께 봅니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: 앱 셸

**Files:**
- Modify: `src/assets/ui.css` (`.app`, `.app-header`, `.intake` 계열, `.status-line`, `.layout`, `.preview-pane`, `.preview-canvas`, `.settings-panel`, `.rail`, 768px 매체 질의)
- Modify: `src/ui/App.tsx` (불러오기 줄 마크업)

**Interfaces:**
- Consumes: Task 1 의 치수 토큰, Task 4 의 포털 목록
- Produces: `.app` 이 `height: 100dvh` 세 줄 격자. `.preview-pane` 이 사진이 없을 때 비어 있는 칸이고 Task 6 이 그 자리를 채웁니다.

- [ ] **Step 1: 불러오기 줄 마크업을 한 줄로 바꿉니다**

`src/ui/App.tsx` 의 `.intake` 블록 전체(주석 포함, `<div className="intake" ...>` 부터 닫는 `</div>` 까지)를 아래로 바꾸십시오.

```tsx
        {/*
         * 사진을 불러오는 일은 한 번 하고 마는 부가 기능이고, 슬라이더를 만지며 결과를
         * 보는 것이 주 기능입니다. 사진이 있든 없든 이 줄은 늘 같은 한 줄이라 사진을
         * 넣어도 아래 미리보기가 밀려나지 않습니다.
         */}
        <div className="intake">
          <label className="file-picker" data-disabled={!ready || busy}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={onPick}
              disabled={!ready || busy}
              className="hs-radio-input"
            />
            <span>{t('action.pick')}</span>
          </label>

          {photos.length > 0 && (
            <PhotoStrip
              photos={photos}
              selected={selected}
              onToggle={toggleSelected}
              onToggleAll={toggleAll}
              disabled={busy}
            />
          )}

          {photos.length > 0 && (
            <span className="photo-count">{t('photos.count', { count: photos.length })}</span>
          )}

          <p role="status" className="status-line">
            {t(status.key, status.vars)}
          </p>
        </div>
```

`.intake-row` 를 감싸던 층과 `photos.length === 0 && <p className="hint">` 줄이 사라집니다. **`.hint` 클래스 자체는 지우지 마십시오.** `src/ui/SettingsPanel.tsx` 가 내보내기 칸에서 아직 씁니다.

- [ ] **Step 2: 셸 CSS 를 씁니다**

`src/assets/ui.css` 에서 아래 규칙들을 바꾸십시오. `body { margin: 0 }` 은 이미 있으므로 그대로 둡니다.

`.app` 을 아래로 바꿉니다.

```css
/*
 * 앱 셸입니다. 화면 높이를 다 쓰는 세 줄 격자이고 셋째 줄이 남는 높이를 전부 받습니다.
 * minmax(0, 1fr) 이라야 안의 내용이 넘칠 때 줄이 늘어나지 않고 안에서 스크롤합니다.
 * 그냥 1fr 을 쓰면 최소 크기가 auto 라 설정 칸이 길어질수록 화면 밖으로 밀려납니다.
 */
.app {
  height: 100dvh;
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
}
```

`.app-header` 를 아래로 바꿉니다. `margin-bottom` 이 사라지고 면과 선이 붙습니다.

```css
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}
```

`.intake`, `.intake[data-compact='true']`, `.intake-row`, `.intake-row > .file-picker, .intake-row > .photo-count`, `.intake-row .photo-strip`, `.intake[data-compact='true'] .status-line`, `.intake-footer` **일곱 규칙을 모두 지우고** 아래 넷으로 갈음하십시오.

```css
/*
 * 불러오기 줄입니다. 점선 상자를 없애고 헤더와 같은 면 위에 한 줄로 눕혔습니다. 사진이
 * 없을 때도 같은 한 줄이라 사진을 넣어도 아래 미리보기가 밀려나지 않습니다.
 */
.intake {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2) var(--space-4);
  min-width: 0;
  background: var(--surface);
  border-bottom: 1px solid var(--border);
}

/*
 * 썸네일이 많아지면 남는 폭이 줄어 단추 글자가 여러 줄로 접히고, 그러면 줄 전체가 다시
 * 높아집니다. 이 둘은 줄어들지도 접히지도 않게 둡니다.
 */
.intake > .file-picker,
.intake > .photo-count {
  flex: 0 0 auto;
  white-space: nowrap;
}

/* 썸네일 묶음만 남는 폭을 쓰고 넘치면 가로로 흐릅니다. 240px 아래로는 눌리지 않습니다. */
.intake > .photo-strip {
  flex: 1 1 240px;
  min-width: 0;
}

/*
 * 상태 문구는 줄 오른쪽 끝입니다. 썸네일 묶음이 있으면 그것이 남는 폭을 먹으므로 자동
 * 여백은 0 이 되고 장수 옆에 붙습니다. 사진이 없어 묶음이 없을 때는 자동 여백이 오른쪽
 * 끝으로 밀어 줍니다. 두 경우 모두 오른쪽 끝입니다.
 */
.status-line {
  flex: 0 1 auto;
  margin: 0 0 0 auto;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--text-sm);
  color: var(--text-dim);
}
```

`.hint` 규칙은 그대로 둡니다.

`.layout` 과 그 자식들을 아래로 바꿉니다. 기존 `.layout`, `.preview-pane`, `.preview-canvas`, `.settings-panel`, `.rail` 규칙을 대체합니다. `.settings-panel[hidden]` 규칙과 그 위 주석은 **그대로 두십시오.**

```css
/*
 * 좁은 화면은 미리보기 위(45dvh 고정), 설정 가운데, 레일 아래(가로)입니다. 768px 부터는
 * 미리보기 왼쪽, 설정 가운데, 레일 오른쪽(세로)으로 바뀝니다. 이 767/768 경계는
 * Rail 이 useSyncExternalStore 로 구독하는 매체 질의와 같아야 aria-orientation 이
 * 실제 배치와 어긋나지 않습니다.
 *
 * 좁은 화면에서 미리보기를 position: sticky 로 붙이는 방법은 쓰지 않습니다. 그리드
 * 항목의 컨테이닝 블록은 자기 그리드 칸이라 칸 안에서만 움직일 수 있고, 칸 높이가 곧
 * 내용 높이면 움직일 여지가 없어 아무 일도 일어나지 않습니다. 줄 높이를 직접 정하면
 * 같은 목적을 확실하게 이룹니다.
 */
.layout {
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 45dvh) minmax(0, 1fr) auto;
  grid-template-areas:
    'preview'
    'settings'
    'rail';
  min-height: 0;
}

.preview-pane {
  grid-area: preview;
  display: grid;
  place-items: center;
  padding: var(--space-4);
  min-width: 0;
  min-height: 0;
  background: var(--bg);
}

/*
 * 캔버스는 대체 요소라 max-width 와 max-height 를 함께 주면 고유 비율을 지키면서 둘 다
 * 만족하는 크기로 줄어듭니다. width: 100% 를 주면 세로가 칸을 넘어 밖으로 나갑니다.
 */
.preview-canvas {
  display: block;
  max-width: 100%;
  max-height: 100%;
}

.settings-panel {
  grid-area: settings;
  display: grid;
  gap: var(--space-3);
  align-content: start;
  padding: var(--space-4);
  min-height: 0;
  overflow-y: auto;
  background: var(--surface);
  font-size: var(--text-md);
}

/*
 * 레일 자체를 설정 패널과 가르는 선입니다. 좁은 화면은 위쪽 경계(가로 선), 768px
 * 부터는 왼쪽 경계(세로 선)로 바뀌어 실제 배치 방향을 따라갑니다.
 */
.rail {
  grid-area: rail;
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0;
  padding: var(--space-2) var(--space-1);
  background: var(--surface);
  border-top: 1px solid var(--border);
}
```

768px 매체 질의의 `.layout` 과 `.rail` 규칙을 아래로 바꿉니다. `.rail-tab:not(:last-child)` 규칙은 그대로 둡니다.

```css
@media (min-width: 768px) {
  .layout {
    grid-template-columns: minmax(0, 1fr) 280px auto;
    grid-template-rows: minmax(0, 1fr);
    grid-template-areas: 'preview settings rail';
  }

  .settings-panel {
    border-left: 1px solid var(--border);
  }

  .rail {
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    border-top: none;
    border-left: 1px solid var(--border);
  }
}
```

**좁은 화면에서 설정 칸에 왼쪽 선이 붙으면 안 되므로 `border-left` 를 매체 질의 안에만 두었습니다.** 좁은 화면에서는 레일의 `border-top` 이 설정 칸과 레일을 가릅니다.

- [ ] **Step 3: 검사**

Run: `npx tsc --noEmit && npm test && npm run build`

Expected: 모두 통과. `scale.test.ts` 가 새 규칙도 검사합니다. 여기서 실패하면 토큰 아닌 값을 쓴 것이니 실패 메시지의 줄 번호를 보고 고치십시오.

- [ ] **Step 4: 눈으로 확인합니다. 이것이 이 작업의 목적입니다**

`npm run dev` 로 띄웁니다. **1280x900 에서 두 테마 모두** 봅니다.

1. 사진 세 장을 넣고 **세 기둥이 같은 높이로 화면 아래까지 닿는지.** 레일 세로선이 중간에 끊기면 안 됩니다.
2. 화면 아래와 좌우에 빈 자리가 없는지. 페이지 자체가 스크롤되지 않아야 합니다.
3. 헤더, 불러오기 줄, 본체의 가로 선이 화면 끝에서 끝까지 닿는지.
4. 미리보기 사진이 칸 안에 온전히 들어오는지. 세로로 긴 사진(예: 800x1200)을 넣어 위아래가 잘리지 않는지 반드시 보십시오. `max-height` 가 듣는지 보는 검사입니다.
5. 사진을 넣기 전과 후에 불러오기 줄 높이가 같은지.
6. 상태 문구가 줄 오른쪽 끝에 있는지. 사진이 없을 때와 있을 때 모두.

**1366x768 에서** 봅니다.

7. 설정 칸이 안에서 스크롤되는지. 프리셋 칸을 열면 카드 아홉 개가 들어갑니다.
8. **서체 목록을 열어 설정 칸 가장자리에서 잘리지 않는지.** Task 4 가 한 일이 여기서 드러납니다.

**1920x1080 에서** 봅니다.

9. 미리보기가 커지고 좌우가 비지 않는지.

**375 폭에서** 봅니다.

10. 미리보기, 설정, 레일 순으로 쌓이는지. 미리보기가 위쪽 45dvh 를 차지하고 그 아래만 스크롤되는지.
11. 레일이 가로로 눕고 탭 사이 구분선이 세로가 아니라 가로인지.

**키보드만으로 한 바퀴** 돕니다. 탭으로 파일 고르기, 썸네일, 레일, 설정 칸의 모든 조작 요소에 닿고 초점 표시가 보이는지. 초점이 화면 밖 요소로 갈 때 브라우저가 스크롤해 주는지.

**작업 전후의 1280x900 스크린샷을 보고서에 남기십시오.**

- [ ] **Step 5: 커밋**

```bash
git add src/assets/ui.css src/ui/App.tsx
git commit -m "$(cat <<'EOF'
화면 높이를 다 쓰는 앱 셸로 교체

세 기둥의 높이가 570/419/176px 로 제각각이라 레일 세로선이 중간에 끊기고 화면
아래 124px 과 좌우 90px 씩이 비어 있었습니다. app 을 height: 100dvh 의 세 줄
격자로 바꿔 헤더, 불러오기 줄, 본체를 쌓고 본체가 남는 높이를 전부 받게 했습니다.

둘러싼 부분은 surface 면 위에 올리고 사진이 놓이는 바닥만 bg 로 두어 면과 면이
1px 선으로 만나게 했습니다. 사용자가 시안 셋 중 이 편집기 크롬을 골랐습니다.

점선 상자와 data-compact 분기를 없앴습니다. 불러오기 줄이 사진 유무와 상관없이
같은 한 줄이라 사진을 넣어도 미리보기가 밀려나지 않습니다. 쓰이지 않던
intake-footer 규칙도 함께 지웠습니다.

캔버스에서 width: 100% 와 min-height 를 빼고 max-width 와 max-height 만 남겼습니다.
대체 요소라 둘을 함께 주면 고유 비율을 지키며 칸 안에 들어옵니다.

좁은 화면은 미리보기를 45dvh 줄로 고정해 늘 보이게 했습니다. position: sticky 는
그리드 항목의 컨테이닝 블록이 자기 칸이라 움직일 여지가 없어 쓰지 않았습니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: 사진이 없을 때의 놓는 곳

**Files:**
- Modify: `src/ui/App.tsx` (미리보기 칸)
- Modify: `src/assets/ui.css` (`.preview-empty` 계열, `.preview-canvas[hidden]`)
- Modify: `src/i18n/ko.ts` (문구 두 개 추가, 하나 삭제)

**Interfaces:**
- Consumes: Task 5 의 `.preview-pane`
- Produces: 없음. 마지막 작업입니다.

- [ ] **Step 1: 문구를 더합니다**

`src/i18n/ko.ts` 의 `drop.hint` 줄을 **지우고** 그 자리에 아래 둘을 넣으십시오. `drop.active` 는 그대로 둡니다.

```ts
  'drop.empty': '사진을 끌어다 놓거나 여기를 눌러 고르십시오',
  'drop.emptyDetail':
    'JPEG, PNG, WebP 파일을 한 번에 {max}장까지 불러옵니다. 사진은 브라우저를 떠나지 않습니다',
```

`drop.hint` 는 Task 5 가 화면에서 뺐으므로 이제 아무도 쓰지 않습니다.

- [ ] **Step 2: 사전 검사가 통과하는 것을 확인합니다**

Run: `npx vitest run src/i18n/index.test.ts`

Expected: PASS. 빈 문구 없음, 해요체 없음, em-dash 없음을 검사합니다.

- [ ] **Step 3: 미리보기 칸에 놓는 곳을 넣습니다**

`src/ui/App.tsx` 위쪽 import 에 아래 둘을 더하십시오.

```ts
import { ImagePlus } from 'lucide-react';
import { MAX_PHOTOS } from './photos';
```

`<section className="preview-pane">` 안을 아래로 바꾸십시오.

```tsx
          <section className="preview-pane">
            {/*
             * 캔버스를 조건부로 빼지 않고 hidden 으로 감춥니다. usePipeline 이 ref 로 붙잡고
             * 있어 다시 붙일 때 컨텍스트를 새로 얻어야 하는데, 그럴 이유가 없습니다.
             * .preview-canvas 에 display: block 이 있으므로 아래 [hidden] 규칙이 반드시
             * 함께 있어야 실제로 감춰집니다.
             */}
            <canvas
              ref={canvasRef}
              role="img"
              aria-label={
                hasPreview
                  ? t('canvas.withFrame', { text: frameText })
                  : photos.length === 0
                    ? t('canvas.empty')
                    : t('canvas.noSelection')
              }
              className="preview-canvas"
              hidden={photos.length === 0}
            />

            {photos.length === 0 && (
              <label className="preview-empty" data-disabled={!ready || busy}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  onChange={onPick}
                  disabled={!ready || busy}
                  className="hs-radio-input"
                />
                <ImagePlus aria-hidden="true" size={40} />
                <span className="preview-empty-main">{t('drop.empty')}</span>
                <span className="preview-empty-sub">
                  {t('drop.emptyDetail', { max: MAX_PHOTOS })}
                </span>
              </label>
            )}
          </section>
```

**입력을 위 불러오기 줄과 공유하지 말고 따로 두십시오.** `label` 이 자기 안의 입력을 가리키므로 `id` 도 `htmlFor` 도 필요 없고, 한 입력에 이름표가 둘 붙는 문제도 생기지 않습니다.

- [ ] **Step 4: CSS 를 더합니다**

`.preview-canvas` 규칙 바로 뒤에 아래를 넣으십시오.

```css
/*
 * .preview-canvas 에 display: block 을 선언했으므로 이 규칙 없이는 hidden 속성이 듣지
 * 않습니다. 저작자 스타일시트가 원점 우선순위로 브라우저 기본 [hidden] 규칙을 덮습니다.
 * .settings-panel 이 실제로 이것에 걸린 적이 있습니다.
 */
.preview-canvas[hidden] {
  display: none;
}

/*
 * 사진이 없을 때 미리보기 칸을 통째로 놓는 곳으로 씁니다. 화면에서 가장 큰 자리가 빈
 * 채로 시작하지 않게 하려는 것입니다. 파일 입력을 감싸는 label 이라 누르면 고르기가
 * 열리고, 그래서 새 상태나 이벤트 처리가 필요 없습니다.
 */
.preview-empty {
  width: 100%;
  height: 100%;
  display: grid;
  place-content: center;
  justify-items: center;
  gap: var(--space-2);
  padding: var(--space-6);
  border: 2px dashed var(--border);
  border-radius: var(--radius-lg);
  color: var(--text-dim);
  text-align: center;
  cursor: pointer;
}

.preview-empty[data-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 감춘 입력이 초점을 받으면 보이는 상자에 초점 표시를 그립니다. */
.preview-empty:has(:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.preview-empty-main {
  font-size: var(--text-md);
  color: var(--text);
}

.preview-empty-sub {
  font-size: var(--text-sm);
}
```

- [ ] **Step 5: 검사**

Run: `npx tsc --noEmit && npm test && npm run build`

Expected: 모두 통과.

- [ ] **Step 6: 눈으로 확인합니다**

`npm run dev` 로 띄우고 **두 테마 모두** 봅니다.

1. 첫 화면에서 점선 상자가 미리보기 칸을 가득 채우고 안내 두 줄이 가운데 있는지.
2. **점선 상자를 눌러 파일 고르기가 열리는지.**
3. 사진을 고르면 점선 상자가 사라지고 그 자리에 사진이 나오는지. **캔버스가 실제로 보이는지 반드시 확인하십시오.** `[hidden]` 규칙을 빠뜨리면 사진이 안 보입니다.
4. 사진을 전부 지우면 다시 점선 상자로 돌아오는지.
5. 탭으로 점선 상자에 초점이 가고 초점 표시가 보이는지. 스페이스나 엔터로 고르기가 열리는지.
6. 창 전체 드래그 앤 드롭이 그대로 되는지. 드래그 중 오버레이가 뜨는지.
7. 375 폭에서 점선 상자가 45dvh 칸 안에 무너지지 않고 들어가는지.

- [ ] **Step 7: 커밋**

```bash
git add src/ui/App.tsx src/assets/ui.css src/i18n/ko.ts
git commit -m "$(cat <<'EOF'
사진이 없을 때 미리보기 칸을 놓는 곳으로 사용

화면에서 가장 큰 자리가 빈 채로 시작하고 있었습니다. 사진이 없을 때 미리보기 칸을
통째로 점선 놓는 곳으로 바꾸고 안내 두 줄을 가운데 두었습니다. 사용자가 시안 셋 중
이것을 골랐습니다. 위 줄 모양이 사진 유무와 무관하게 같으므로 사진을 넣어도 화면이
흔들리지 않습니다.

점선 상자는 파일 입력을 감싸는 label 이라 누르면 고르기가 열립니다. 새 상태나
이벤트 처리가 필요 없고, 위 줄의 입력과 공유하지 않아 한 입력에 이름표가 둘 붙는
문제도 없습니다.

캔버스는 조건부로 빼지 않고 hidden 으로 감춥니다. display: block 을 선언한 요소라
preview-canvas[hidden] 규칙을 함께 넣어야 실제로 감춰집니다.

쓰이지 않게 된 drop.hint 를 지우고 drop.empty 와 drop.emptyDetail 을 더했습니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>
EOF
)"
```

---

## 자기 검토 결과

계획을 다 쓰고 스펙과 대조했습니다.

**스펙 대응.** 1절 치수 토큰 → Task 1, 2. 2절 검사 → Task 1, 2. 3절 지침 → Task 3. 4절 격자와 세 기둥 → Task 5. 사진이 없을 때 → Task 6. 서체 목록 잘림 → Task 4. 좁은 화면 → Task 5. 없어지는 것 → Task 5, 6. 5절 검증 → 각 작업의 눈 확인 단계. 빠진 요구사항이 없습니다.

**고친 것 둘.**

스펙이 좁은 화면에서 미리보기를 `position: sticky` 로 붙인다고 적었는데, 그리드 항목의 컨테이닝 블록은 자기 그리드 칸이라 칸 높이가 곧 내용 높이면 움직일 여지가 없어 아무 일도 일어나지 않습니다. 줄 높이를 `minmax(0, 45dvh)` 로 직접 정하는 방식으로 스펙과 계획을 모두 고쳤습니다.

스펙이 `--space-8: 32px` 을 선언했는데 쓸 자리가 없습니다. 안 쓰는 단계를 선언하면 규약이 느슨해지므로 스펙에서 뺐습니다. 남은 열한 개는 모두 쓰는 자리가 있습니다.

**검사 코드에서 잡은 것 둘.**

Task 2 의 파서를 줄 단위 정규식으로 먼저 써 봤더니 여러 줄에 걸친 `linear-gradient` 와 `box-shadow` 값의 중간 줄을 선택자로 잘못 읽어 두 곳을 엉뚱한 이름으로 보고했습니다. 중괄호 깊이를 세는 방식으로 바꾸고, 파서가 조용히 아무것도 못 찾을 때를 막는 검사(`declarations.length > 50`)를 함께 넣었습니다.

`SPACE_TOKEN` 정규식을 `/^var\(--space-[1-4|6]\)$/` 로 썼는데 문자 클래스 안의 `|` 는 리터럴이라 `var(--space-|)` 까지 통과시킵니다. `(1|2|3|4|6)` 으로 고쳤습니다.

**산수를 다시 확인한 것.** Task 4 의 `listPosition` 기댓값 셋을 표로 풀어 계획서에 적어 두었습니다. 이 저장소에서 계획서의 산술 오류를 의심 없이 옮긴 탓에 두 번 더 고쳐야 했던 일이 세 번 있었습니다. 옮기기 전에 표의 계산을 직접 확인하고, 어긋나면 멈추고 보고하십시오.
