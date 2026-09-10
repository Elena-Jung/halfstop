# halfstop 화면 본체 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 라이트룸식 아이콘 레일과 사이드 패널, 어두운 테마, 한국어 사전, WCAG 2.2 AA 를 갖춘 화면 본체를 만듭니다.

**Architecture:** 옵션 선언에 `labelKey` 와 `groupKey` 를 더해 레일 구성을 데이터로 정합니다. 화면은 `App.tsx` 한 파일에서 컴포넌트 여러 개로 나뉘고, 레일은 `tablist` 하나로 넓은 화면(세로)과 좁은 화면(가로)을 함께 처리합니다. 색은 CSS 변수로 한 곳에 모으고 대비를 계산으로 확인합니다.

**Tech Stack:** React 19, TypeScript, Vite, `lucide-react`(아이콘, ISC).

## Global Constraints

- `src/core/` 아래 코드는 `react` 를 import 하지 않고 `document`, `window`, `localStorage` 를 직접 참조하지 않습니다. `src/core/coreBoundary.test.ts` 가 이것을 기계로 검사합니다.
- `core` 는 번역된 문자열을 반환하지 않습니다. 키와 구조화된 값만 반환하고 UI 가 옮깁니다.
- 이미지를 서버로 보내지 않습니다. 네트워크 요청을 만드는 코드를 넣지 않습니다.
- 프레임에 그릴 수 있는 값은 촬영 설정과 장비명뿐입니다. GPS, 소유자명, 일련번호는 넣지 않습니다.
- 한국어 문구는 화면에 보이는 것까지 모두 습니다체로 씁니다. 해요체를 쓰지 않습니다. 하십시오체는 같은 합쇼체 층위이므로 위반이 아닙니다.
- 코드 주석도 습니다체입니다. em-dash(U+2014)와 en-dash(U+2013)를 쓰지 않습니다.
- 커밋 메시지 제목은 명사구로 씁니다.
- 새 의존성은 `lucide-react` 하나만 허용합니다. 그 밖의 의존성을 추가하지 않습니다. 특히 DOM 테스트용(`jsdom`, `happy-dom`, `@testing-library/*`)을 추가하지 않습니다.
- 테스트 환경은 `environment: 'node'` 이고 `include` 는 `src/**/*.test.ts` 입니다. 이 설정을 바꾸지 않습니다. 화면 렌더링 테스트를 만들려 하지 마십시오. 순수 로직만 단위 테스트하고 렌더링은 사람이 확인합니다.
- 옵션에서 크기를 뜻하는 값의 단위는 픽셀이 아니라 디자인 단위입니다.
- 접근성 목표는 WCAG 2.2 AA 입니다.

## File Structure

| 파일 | 책임 |
|---|---|
| `src/core/layout/options.ts` | `PresetOption` 에 `labelKey`, `groupKey` 추가 |
| `src/core/layout/layouts/bar.ts`, `matte.ts` | 옵션 선언에 두 필드 채우기 |
| `src/core/layout/presets.ts` | `label` 을 `labelKey` 로 교체 |
| `src/i18n/ko.ts` | 한국어 사전. 키와 문자열의 유일한 출처 |
| `src/i18n/index.ts` | `t()` 와 `MessageKey` 타입 |
| `src/ui/errorMessage.ts` | 정규식으로 분류한 뒤 문구가 아니라 키를 돌려주도록 변경 |
| `src/ui/theme.ts` | 없음. 색은 `ui.css` 에만 둡니다 |
| `src/assets/ui.css` | 색 토큰과 레이아웃. 색의 유일한 출처 |
| `src/ui/contrast.ts` | 명암 대비 계산(순수 함수) |
| `src/ui/OptionField.tsx` | 옵션 하나를 입력 요소로 그리기 |
| `src/ui/SettingsPanel.tsx` | 고른 레일 칸의 옵션 목록 또는 프리셋 목록 |
| `src/ui/Rail.tsx` | `tablist` 아이콘 레일 |
| `src/ui/DropZone.tsx` | 창 전체 드래그앤드롭 |
| `src/ui/App.tsx` | 위 조각을 배치하고 `usePipeline` 과 잇기 |
| `src/ui/usePipeline.ts` | 내보내기 해상도 상태 추가 |

---

## Task 1: 옵션 선언에 이름표 키와 묶음 키 추가

`PresetOption` 에 두 필드를 더하고 두 레이아웃 선언과 아홉 프리셋을 그에 맞춥니다. 이 작업이 만드는 데이터 위에서 레일이 동작하므로 가장 먼저 합니다.

**Files:**
- Modify: `src/core/layout/options.ts`, `src/core/layout/layouts/bar.ts`, `src/core/layout/layouts/matte.ts`, `src/core/layout/presets.ts`
- Modify: `src/core/layout/options.test.ts`, `src/core/layout/presets.test.ts`
- Modify: `src/ui/App.tsx` (`Preset.label` 을 쓰던 자리 한 곳만)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `type OptionGroup = 'frame' | 'text'`
  - `PresetOption` 의 모든 갈래가 `labelKey: string` 과 `groupKey: OptionGroup` 을 갖습니다
  - `Preset` 의 `label: string` 이 `labelKey: string` 으로 바뀝니다

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/options.test.ts` 끝에 더합니다.

```ts
describe('이름표 키와 묶음 키', () => {
  const ALL = [...BAR_OPTIONS, ...MATTE_OPTIONS];

  it('모든 옵션이 labelKey 와 groupKey 를 갖습니다', () => {
    for (const option of ALL) {
      expect(option.labelKey, option.id).toBeTruthy();
      expect(['frame', 'text']).toContain(option.groupKey);
    }
  });

  it('labelKey 는 option. 으로 시작하고 id 를 그대로 씁니다', () => {
    for (const option of ALL) {
      expect(option.labelKey).toBe(`option.${option.id}`);
    }
  });

  it('같은 id 는 두 레이아웃에서 같은 묶음에 들어갑니다', () => {
    const seen = new Map<string, string>();
    for (const option of ALL) {
      const previous = seen.get(option.id);
      if (previous !== undefined) expect(option.groupKey, option.id).toBe(previous);
      seen.set(option.id, option.groupKey);
    }
  });
});
```

`src/core/layout/presets.test.ts` 끝에 더합니다.

```ts
describe('프리셋 이름표 키', () => {
  it('아홉 프리셋이 preset. 으로 시작하는 키를 갖습니다', () => {
    for (const preset of PRESETS) {
      expect(preset.labelKey).toBe(`preset.${preset.id}`);
    }
  });

  it('한국어 문자열을 직접 담지 않습니다', () => {
    for (const preset of PRESETS) {
      expect(/[가-힣]/.test(preset.labelKey), preset.id).toBe(false);
    }
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/core/layout/options.test.ts src/core/layout/presets.test.ts`
Expected: `labelKey` 가 없어 타입 오류 또는 `undefined` 로 실패합니다.

- [ ] **Step 3: 구현 작성**

`src/core/layout/options.ts` 의 `PresetOption` 을 바꿉니다. 여섯 갈래 모두에 두 필드를 더합니다.

```ts
/** 레일의 어느 칸에 들어갈지 정합니다. 프리셋 칸과 내보내기 칸은 옵션이 아니라 따로 있습니다. */
export type OptionGroup = 'frame' | 'text';

interface OptionBase {
  id: string;
  /** 설정 화면에 보일 이름의 번역 키입니다. core 는 번역하지 않습니다. */
  labelKey: string;
  groupKey: OptionGroup;
}

export type PresetOption =
  | (OptionBase & { type: 'color'; default: string })
  | (OptionBase & { type: 'number'; default: number; unit: 'u'; min: number; max: number })
  | (OptionBase & { type: 'boolean'; default: boolean })
  | (OptionBase & { type: 'select'; options: readonly string[]; default: string })
  | (OptionBase & { type: 'range'; min: number; max: number; step: number; default: number })
  | (OptionBase & { type: 'text'; default: string });
```

`src/core/layout/layouts/bar.ts` 의 `BAR_OPTIONS` 를 아래 표대로 채웁니다. `labelKey` 는 언제나 `` `option.${id}` `` 입니다.

| id | groupKey |
|---|---|
| `MODE` | `frame` |
| `ALIGN` | `text` |
| `BACKGROUND` | `frame` |
| `TEXT_COLOR` | `text` |
| `BAR_HEIGHT` | `frame` |
| `SIDE_PADDING` | `frame` |
| `FONT_SIZE` | `text` |
| `SUB_SCALE` | `text` |
| `FONT_WEIGHT` | `text` |
| `FONT_FAMILY` | `text` |
| `DIVIDER` | `text` |
| `PRIMARY_MAIN` | `text` |
| `PRIMARY_SUB` | `text` |
| `SECONDARY_MAIN` | `text` |
| `SECONDARY_SUB` | `text` |
| `FOOTER` | `text` |

예시입니다.

```ts
  { id: 'MODE', labelKey: 'option.MODE', groupKey: 'frame', type: 'select', options: ['split', 'single'], default: 'split' },
  { id: 'BAR_HEIGHT', labelKey: 'option.BAR_HEIGHT', groupKey: 'frame', type: 'number', default: 120, unit: 'u', min: 40, max: 500 },
```

`src/core/layout/layouts/matte.ts` 의 `MATTE_OPTIONS` 도 같은 규칙으로 채웁니다. `PAD_TOP`, `PAD_RIGHT`, `PAD_BOTTOM`, `PAD_LEFT` 는 `frame` 입니다. 나머지 id 는 위 표와 같은 묶음을 씁니다.

`src/core/layout/presets.ts` 에서 `Preset` 의 `label` 을 `labelKey` 로 바꿉니다.

```ts
export interface Preset {
  id: string;
  /** 화면에 보일 이름의 번역 키입니다. */
  labelKey: string;
  layout: 'bar' | 'matte';
  values: Record<string, OptionValue>;
}
```

아홉 프리셋의 `label: '바디와 렌즈'` 같은 줄을 `labelKey: 'preset.body-lens'` 로 바꿉니다. 한국어 문자열은 Task 2 의 사전으로 옮겨집니다. 지금은 사전이 없으므로 `src/ui/App.tsx` 에서 `preset.label` 을 쓰던 자리는 임시로 `preset.id` 를 보여 주게 두십시오. Task 2 가 그것을 `t(preset.labelKey)` 로 바꿉니다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx tsc --noEmit && npm test`
Expected: 전부 통과합니다. 기존 기댓값이 깨지면 멈추고 보고하십시오.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/options.ts src/core/layout/layouts/bar.ts src/core/layout/layouts/matte.ts src/core/layout/presets.ts src/core/layout/options.test.ts src/core/layout/presets.test.ts src/ui/App.tsx
git commit -m "옵션과 프리셋에 이름표 키와 묶음 키 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 2: 한국어 사전과 조회 함수

키를 실제 문자열로 바꾸는 계층을 만들고, 화면에 흩어진 한국어를 전부 이 함수 호출로 옮깁니다. 사전을 만드는 일과 문자열을 옮기는 일을 한 작업으로 묶는 이유는, 나누면 어느 문구가 아직 안 옮겨졌는지 리뷰에서 잡기 어렵기 때문입니다.

**Files:**
- Create: `src/i18n/ko.ts`, `src/i18n/index.ts`, `src/i18n/index.test.ts`
- Modify: `src/ui/errorMessage.ts`, `src/ui/errorMessage.test.ts`, `src/ui/App.tsx`, `src/ui/usePipeline.ts`

**Interfaces:**
- Consumes: Task 1 의 `labelKey`, `groupKey`
- Produces:
  - `type MessageKey = keyof typeof ko`
  - `function t(key: MessageKey, vars?: Record<string, string | number>): string`
  - `errorMessage.ts` 의 `toUserMessage(error: unknown): MessageKey`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/i18n/index.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ko } from './ko';
import { t } from './index';

describe('t', () => {
  it('키에 해당하는 문구를 돌려줍니다', () => {
    expect(t('action.download')).toBe(ko['action.download']);
  });

  it('중괄호 자리에 값을 끼워 넣습니다', () => {
    expect(t('status.loaded', { name: 'a.jpg' })).toBe('a.jpg 파일을 불러왔습니다');
  });

  it('값을 안 넘기면 자리표시자를 그대로 둡니다', () => {
    expect(t('status.loaded')).toContain('{name}');
  });
});

describe('사전', () => {
  it('빈 문구가 없습니다', () => {
    for (const [key, value] of Object.entries(ko)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('해요체를 쓰지 않습니다', () => {
    // 습니다체만 씁니다. 종결형이 요 로 끝나는 문구를 걸러냅니다.
    for (const [key, value] of Object.entries(ko)) {
      expect(/요[.!?]?$/.test(value.trim()), `${key}: ${value}`).toBe(false);
    }
  });

  it('em-dash 와 en-dash 를 쓰지 않습니다', () => {
    for (const [key, value] of Object.entries(ko)) {
      expect(/[–—]/.test(value), key).toBe(false);
    }
  });

  it('모든 옵션과 프리셋의 키가 사전에 있습니다', () => {
    for (const option of [...BAR_OPTIONS, ...MATTE_OPTIONS]) {
      expect(Object.hasOwn(ko, option.labelKey), option.labelKey).toBe(true);
    }
    for (const preset of PRESETS) {
      expect(Object.hasOwn(ko, preset.labelKey), preset.labelKey).toBe(true);
    }
  });
});
```

`BAR_OPTIONS`, `MATTE_OPTIONS`, `PRESETS` 를 import 하십시오.

`src/ui/errorMessage.test.ts` 의 기존 테스트를 키 비교로 바꿉니다. 기존 테스트가 문구 문자열을 기대하고 있다면 그 자리를 `MessageKey` 로 바꾸는 것이 이 작업의 의도된 변경입니다. 바꾼 뒤에도 같은 입력이 같은 분류로 가는지 확인하십시오.

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npx vitest run src/i18n src/ui/errorMessage.test.ts`
Expected: `Cannot find module './ko'`.

- [ ] **Step 3: 구현 작성**

`src/i18n/ko.ts` 를 만듭니다. 키는 점으로 나눈 이름이고 값은 습니다체 문구입니다. 아래 키를 모두 채우십시오. 값이 비어 있으면 테스트가 잡습니다.

```ts
/**
 * 한국어 사전입니다. 키와 문자열의 유일한 출처이고, 영어는 나중에 이 모양의 파일을 하나 더
 * 두면 됩니다. 라이브러리를 쓰지 않는 이유는 키가 백 개 남짓이라 타입이 붙은 사전 하나로
 * 충분하고, 그래야 키 오타를 컴파일 시점에 잡을 수 있기 때문입니다.
 */
export const ko = {
  // 레일
  'rail.preset': '프리셋',
  'rail.frame': '프레임',
  'rail.text': '텍스트',
  'rail.export': '내보내기',
  'rail.label': '설정 묶음',

  // 프리셋 이름
  'preset.body-lens': '바디와 렌즈',
  'preset.gear-exposure': '장비와 노출',
  'preset.one-line': '한 줄',
  'preset.shot-on': 'Shot on',
  'preset.minimal': '미니멀',
  'preset.film': '필름 데이터백',
  'preset.polaroid': '폴라로이드',
  'preset.letterbox': '레터박스',
  'preset.poster': '포스터',

  // 옵션 이름
  'option.MODE': '배치',
  'option.ALIGN': '정렬',
  'option.BACKGROUND': '배경색',
  'option.TEXT_COLOR': '글자색',
  'option.BAR_HEIGHT': '바 높이',
  'option.SIDE_PADDING': '좌우 여백',
  'option.PAD_TOP': '위 여백',
  'option.PAD_RIGHT': '오른쪽 여백',
  'option.PAD_BOTTOM': '아래 여백',
  'option.PAD_LEFT': '왼쪽 여백',
  'option.FONT_SIZE': '글자 크기',
  'option.SUB_SCALE': '부 줄 비율',
  'option.FONT_WEIGHT': '글자 굵기',
  'option.FONT_FAMILY': '서체',
  'option.DIVIDER': '구분자',
  'option.PRIMARY_MAIN': '왼쪽 주 줄',
  'option.PRIMARY_SUB': '왼쪽 부 줄',
  'option.SECONDARY_MAIN': '오른쪽 주 줄',
  'option.SECONDARY_SUB': '오른쪽 부 줄',
  'option.FOOTER': '꼬리 줄',

  // 옵션 값 이름
  'value.MODE.split': '좌우 나눔',
  'value.MODE.single': '한 덩어리',
  'value.MODE.poster': '포스터',
  'value.ALIGN.left': '왼쪽',
  'value.ALIGN.center': '가운데',
  'value.ALIGN.right': '오른쪽',

  // 내보내기
  'export.size': '크기',
  'export.size.original': '원본',
  'export.size.4k': '4K',
  'export.size.2k': '2K',
  'export.size.sns': 'SNS',
  'action.download': '내려받기',
  'action.downloading': '만드는 중입니다',
  'action.pick': '사진 고르기',

  // 상태
  'status.preparing': '준비하는 중입니다',
  'status.readyToDrop': '사진을 끌어다 놓거나 위에서 고르십시오',
  'status.reading': '읽는 중입니다',
  'status.loaded': '{name} 파일을 불러왔습니다',
  'status.onlyFirst': '{name} 파일 하나만 불러왔습니다. 여러 장을 한 번에 처리하는 기능은 아직 없습니다',
  'status.rendering': '전체 해상도로 그리는 중입니다',
  'status.downloaded': '내려받았습니다. {width}x{height}',
  'status.downloadedClamped': '내려받았습니다. 기기 한계 때문에 {width}x{height} 로 줄였습니다',
  'status.fontFailed': '{font} 서체를 불러오지 못했습니다',

  // 드롭
  'drop.hint': '창 어디에나 사진을 끌어다 놓을 수 있습니다',
  'drop.active': '여기에 놓으십시오',

  // 캔버스
  'canvas.empty': '아직 불러온 사진이 없습니다',
  'canvas.withFrame': '프레임을 씌운 사진 미리보기입니다. 프레임에 적힌 글은 {text} 입니다',

  // 오류
  'error.decode': '이 사진을 열지 못했습니다. 다른 파일로 시도하십시오',
  'error.tooLarge': '사진이 너무 커서 이 기기에서 처리하지 못했습니다',
  'error.canvas': '이 브라우저에서는 그리기를 쓸 수 없습니다',
  'error.exportSize': '내보낼 크기를 정하지 못했습니다. 여백 값을 확인하십시오',
  'error.worker': '그리는 중에 문제가 생겼습니다. 다시 시도하십시오',
  'error.unknown': '알 수 없는 문제가 생겼습니다',
} as const;

export type MessageKey = keyof typeof ko;
```

`src/i18n/index.ts`:

```ts
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
```

`src/ui/errorMessage.ts` 를 키를 돌려주도록 바꿉니다. 기존 `RULES` 의 정규식은 그대로 두고 `text` 를 `key` 로 바꿉니다.

```ts
import type { MessageKey } from '../i18n';

interface Rule {
  match: RegExp;
  key: MessageKey;
}

// core 가 던지는 Error.message 를 사용자용 키로 분류합니다. core 는 번역하지 않으므로
// 이 자리가 그 경계입니다.
const RULES: readonly Rule[] = [
  // 기존 정규식을 그대로 옮기고 text 를 아래 키로 바꿉니다.
  // 디코딩 실패 -> 'error.decode'
  // 크기 초과 -> 'error.tooLarge'
  // 2D 컨텍스트 -> 'error.canvas'
  // 내보내기 크기 -> 'error.exportSize'
  // 워커 -> 'error.worker'
];

export function toUserMessage(error: unknown): MessageKey {
  const message = error instanceof Error ? error.message : String(error);
  for (const rule of RULES) if (rule.match.test(message)) return rule.key;
  return 'error.unknown';
}
```

기존 파일의 정규식과 문구를 열어 위 다섯 키에 하나씩 대응시키십시오. 대응이 애매한 규칙이 있으면 임의로 정하지 말고 보고하십시오.

`src/ui/usePipeline.ts` 의 `setStatus` 호출을 전부 키 기반으로 바꿉니다. 상태를 문자열이 아니라 `{ key: MessageKey; vars?: Record<string, string | number> }` 로 들고, 훅은 그 객체를 돌려줍니다. 화면이 `t()` 로 옮깁니다.

```ts
export interface StatusMessage {
  key: MessageKey;
  vars?: Record<string, string | number>;
}
```

`usePipeline` 의 반환값에서 `status: string` 을 `status: StatusMessage` 로 바꾸고, `App.tsx` 가 `t(status.key, status.vars)` 로 그립니다.

`src/ui/App.tsx` 의 하드코딩된 한국어를 모두 `t()` 호출로 바꿉니다. 대상은 드래그 오버레이 문구, 드롭 안내, 캔버스 `aria-label`, 프리셋 이름표, 내려받기 단추입니다. 프리셋 이름은 `t(preset.labelKey)` 로, 옵션 이름은 `t(option.labelKey)` 로 바꿉니다.

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx tsc --noEmit && npm test`
Expected: 전부 통과합니다.

- [ ] **Step 5: 남은 한국어가 없는지 확인**

Run: `grep -rnP '[\x{AC00}-\x{D7A3}]' src/ui src/i18n --include=*.ts --include=*.tsx | grep -v '\.test\.' | grep -v '^\S*i18n/ko.ts' | grep -vE '^\s*//|\*'`
Expected: 주석 말고 남는 줄이 없습니다. 남으면 그 줄을 사전으로 옮기십시오.

- [ ] **Step 6: 커밋**

```bash
git add src/i18n src/ui/errorMessage.ts src/ui/errorMessage.test.ts src/ui/App.tsx src/ui/usePipeline.ts
git commit -m "한국어 사전과 조회 함수 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 3: App.tsx 를 컴포넌트로 나누기

동작을 바꾸지 않고 구조만 나눕니다. 지금 한 파일에 드래그앤드롭, 입력 필드 렌더링, 배치가 섞여 있어 레일 마크업을 그 위에 바로 얹으면 리뷰할 diff 가 한 파일에서 너무 커집니다.

**Files:**
- Create: `src/ui/OptionField.tsx`, `src/ui/DropZone.tsx`
- Modify: `src/ui/App.tsx`

**Interfaces:**
- Consumes: Task 2 의 `t`
- Produces:
  - `function OptionField(props: { option: PresetOption; value: OptionValue; disabled: boolean; onChange: (value: OptionValue) => void }): JSX.Element`
  - `function DropZone(props: { disabled: boolean; onFiles: (files: readonly File[]) => void; children: React.ReactNode }): JSX.Element`

- [ ] **Step 1: OptionField 만들기**

지금 `App.tsx` 안의 `field()` 함수와 `optionLabel()` 헬퍼를 `src/ui/OptionField.tsx` 로 옮깁니다. 여섯 갈래(`color`, `boolean`, `number`, `range`, `select`, `text`)를 그대로 유지하십시오. 바꾸는 것은 두 가지뿐입니다.

- 이름표를 `option.id` 가 아니라 `t(option.labelKey)` 로 그립니다.
- `select` 의 값 이름표는 `MODE` 와 `ALIGN` 이면 `` t(`value.${option.id}.${value}` as MessageKey) `` 로, `FONT_FAMILY` 면 기존대로 `fontById(value).label` 로, 그 밖에는 값을 그대로 씁니다. 사전에 없는 키를 넘기지 않도록 `Object.hasOwn(ko, key)` 로 먼저 확인하십시오.

- [ ] **Step 2: DropZone 만들기**

`App.tsx` 안의 창 전체 드래그앤드롭 처리(`dragenter`/`dragover`/`dragleave`/`drop` 리스너와 `dragging` 상태, 오버레이 마크업)를 `src/ui/DropZone.tsx` 로 옮깁니다. `disabled` 가 참이면 이벤트를 받아도 아무 일도 하지 않고 오버레이도 켜지 않습니다. 내보내는 동안 사진이 바뀌는 것을 막기 위해 이미 있는 동작이므로 없애지 마십시오.

- [ ] **Step 3: App.tsx 정리**

`App.tsx` 는 `usePipeline` 호출, `DropZone` 으로 감싸기, 미리보기 캔버스, 설정 패널 자리, 내려받기 단추만 남깁니다. 동작은 하나도 바뀌지 않아야 합니다.

- [ ] **Step 4: 검사**

Run: `npx tsc --noEmit && npm test`
Expected: 전부 통과합니다. 이 작업은 순수한 구조 변경이므로 테스트 결과가 달라지면 안 됩니다.

- [ ] **Step 5: 커밋**

```bash
git add src/ui/OptionField.tsx src/ui/DropZone.tsx src/ui/App.tsx
git commit -m "화면을 옵션 필드와 드롭 영역 컴포넌트로 분리

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 4: 아이콘 레일과 반응형 배치

`tablist` 하나로 넓은 화면의 세로 레일과 좁은 화면의 가로 탭 바를 함께 처리합니다. 보조 기술 쪽에서 두 배치는 같은 구조이고 `aria-orientation` 만 다릅니다.

**Files:**
- Create: `src/ui/Rail.tsx`, `src/ui/SettingsPanel.tsx`, `src/ui/groups.ts`, `src/ui/groups.test.ts`
- Modify: `src/ui/App.tsx`, `src/ui/usePipeline.ts`, `src/assets/ui.css`, `package.json`

**Interfaces:**
- Consumes: Task 1 의 `OptionGroup`, Task 2 의 `t`, Task 3 의 `OptionField`
- Produces:
  - `type RailTab = 'preset' | 'frame' | 'text' | 'export'`
  - `const RAIL_TABS: readonly RailTab[]`
  - `function groupOptions(options: readonly PresetOption[]): Record<OptionGroup, readonly PresetOption[]>`
  - `usePipeline` 이 `exportSize: ExportPreset` 과 `setExportSize` 를 더 돌려줍니다

- [ ] **Step 1: 의존성 추가**

```bash
npm install lucide-react
```

설치한 버전을 보고서에 적으십시오. 이 하나만 추가합니다.

- [ ] **Step 2: 실패하는 테스트 작성**

`src/ui/groups.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BAR_OPTIONS } from '../core/layout/layouts/bar';
import { MATTE_OPTIONS } from '../core/layout/layouts/matte';
import { groupOptions, RAIL_TABS } from './groups';

describe('groupOptions', () => {
  it('선언 순서를 지키며 묶음별로 나눕니다', () => {
    const grouped = groupOptions(BAR_OPTIONS);
    const flat = [...grouped.frame, ...grouped.text];
    expect(flat.length).toBe(BAR_OPTIONS.length);
    for (const group of ['frame', 'text'] as const) {
      const ids = grouped[group].map((o) => o.id);
      const expected = BAR_OPTIONS.filter((o) => o.groupKey === group).map((o) => o.id);
      expect(ids).toEqual(expected);
    }
  });

  it('두 레이아웃 모두 어느 묶음도 비지 않습니다', () => {
    for (const options of [BAR_OPTIONS, MATTE_OPTIONS]) {
      const grouped = groupOptions(options);
      expect(grouped.frame.length).toBeGreaterThan(0);
      expect(grouped.text.length).toBeGreaterThan(0);
    }
  });

  it('레일 칸은 네 개이고 순서가 정해져 있습니다', () => {
    expect(RAIL_TABS).toEqual(['preset', 'frame', 'text', 'export']);
  });
});
```

- [ ] **Step 3: groups.ts 작성**

```ts
import type { OptionGroup, PresetOption } from '../core/layout/options';

export type RailTab = 'preset' | OptionGroup | 'export';

/** 레일에 보일 순서입니다. 프리셋을 먼저 고르고 그 위에서 다듬는 흐름을 따릅니다. */
export const RAIL_TABS: readonly RailTab[] = ['preset', 'frame', 'text', 'export'];

export function groupOptions(
  options: readonly PresetOption[],
): Record<OptionGroup, readonly PresetOption[]> {
  const frame: PresetOption[] = [];
  const text: PresetOption[] = [];
  for (const option of options) {
    if (option.groupKey === 'frame') frame.push(option);
    else text.push(option);
  }
  return { frame, text };
}
```

- [ ] **Step 4: Rail.tsx 작성**

`lucide-react` 에서 아이콘 네 개를 가져옵니다. `LayoutGrid`(프리셋), `Frame`(프레임), `Type`(텍스트), `Download`(내보내기)를 쓰십시오. 이 이름이 실제로 있는지 먼저 확인하고, 없으면 뜻이 가까운 다른 이름을 골라 보고서에 적으십시오.

요구사항입니다.

- 바깥 요소에 `role="tablist"` 와 `aria-label={t('rail.label')}`, `aria-orientation` 을 둡니다. `orientation` 은 props 로 받습니다.
- 각 단추에 `role="tab"`, `aria-selected`, `id`, `aria-controls` 를 둡니다. 아이콘만 있는 단추이므로 `aria-label={t(...)}` 를 반드시 붙입니다. 이름 없는 아이콘 단추는 화면 낭독기에 `단추` 로만 읽힙니다.
- 화살표 키로 칸을 옮깁니다. 세로면 위아래, 가로면 좌우입니다. `Home` 과 `End` 도 받습니다. 끝에서 다음을 누르면 처음으로 돌아갑니다.
- 고른 탭만 `tabIndex={0}` 이고 나머지는 `-1` 입니다. 탭 키로 레일에 들어오면 고른 칸에 바로 닿습니다.
- 화살표로 옮기면 그 단추에 초점을 옮깁니다.
- 단추 크기는 최소 44x44 CSS 픽셀입니다. WCAG 2.5.8 의 24x24 를 넉넉히 넘깁니다.

- [ ] **Step 5: SettingsPanel.tsx 작성**

고른 탭에 따라 내용을 그립니다. 바깥 요소에 `role="tabpanel"`, `id`, `aria-labelledby` 를 둡니다.

- `preset`: 아홉 프리셋을 고르는 목록입니다. `select` 대신 라디오 묶음으로 만들어 한눈에 보이게 하십시오. 각 라디오의 이름표는 `t(preset.labelKey)` 입니다.
- `frame`, `text`: `groupOptions` 로 나눈 옵션을 `OptionField` 로 그립니다.
- `export`: 크기 고르는 `select`(`원본`/`4K`/`2K`/`SNS`)와 내려받기 단추입니다.

`MODE` 가 `split` 이 아닐 때만 `ALIGN` 을 보입니다. `split` 에서는 좌우가 이미 정해져 정렬이 뜻이 없습니다.

- [ ] **Step 6: usePipeline 에 내보내기 크기 추가**

`exportSize` 상태(`ExportPreset`, 기본 `'original'`)와 `setExportSize` 를 더하고, `download()` 이 하드코딩하던 `'original'` 자리에 이 값을 넘깁니다. 저장 설정에도 함께 담지는 마십시오. 내보내기 크기는 그때그때 고르는 값입니다.

- [ ] **Step 7: App.tsx 배치**

넓은 화면은 왼쪽 미리보기, 가운데 설정 패널, 오른쪽 세로 레일입니다. 좁은 화면은 위 미리보기, 가운데 패널, 아래 가로 레일입니다. CSS 미디어 쿼리로 나누고, 어느 쪽이든 사진이 계속 보여야 합니다.

`orientation` 은 `window.matchMedia('(min-width: 768px)')` 로 정하고 변화를 구독하십시오. `useSyncExternalStore` 를 쓰면 깔끔합니다.

- [ ] **Step 8: 검사와 눈으로 확인**

Run: `npx tsc --noEmit && npm test && npm run build`

그 뒤 개발 서버에서 다음을 확인하고 보고서에 적으십시오. 확인하지 못한 것은 확인하지 못했다고 적으십시오.

- 탭 키로 레일에 들어가 화살표로 네 칸을 오갈 수 있습니다.
- 넓은 화면과 좁은 화면에서 배치가 스펙대로 바뀝니다.
- 프리셋을 바꾸면 프레임 칸과 텍스트 칸의 옵션 목록이 함께 바뀝니다.
- `MODE` 를 `single` 로 바꾸면 `ALIGN` 이 나타나고 `split` 으로 되돌리면 사라집니다.

- [ ] **Step 9: 커밋**

```bash
git add package.json package-lock.json src/ui/Rail.tsx src/ui/SettingsPanel.tsx src/ui/groups.ts src/ui/groups.test.ts src/ui/App.tsx src/ui/usePipeline.ts src/assets/ui.css
git commit -m "아이콘 레일과 설정 패널, 반응형 배치 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 5: 어두운 테마와 명암 대비 검사

편집 화면이 밝으면 주변 밝기가 사진 판단을 흐립니다. 기본을 어두운 테마로 두고 색을 CSS 변수 한 곳에 모읍니다. 대비는 눈이 아니라 숫자로 확인합니다.

**Files:**
- Create: `src/ui/contrast.ts`, `src/ui/contrast.test.ts`, `src/ui/theme.test.ts`
- Modify: `src/assets/ui.css`, `src/ui/App.tsx`, `src/ui/Rail.tsx`, `src/ui/SettingsPanel.tsx`, `src/ui/OptionField.tsx`, `src/ui/DropZone.tsx`, `index.html`

**Interfaces:**
- Consumes: Task 4 의 컴포넌트
- Produces: `function contrastRatio(a: string, b: string): number`

- [ ] **Step 1: 대비 계산 함수와 테스트**

`src/ui/contrast.ts`:

```ts
/**
 * WCAG 2.2 의 상대 휘도와 명암비입니다. 눈으로 보는 대신 숫자로 확인하기 위한 것입니다.
 * 색은 `#rrggbb` 형식만 받습니다. 화면에 쓰는 색을 그 형식으로 통일해 두었습니다.
 */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) throw new Error(`색 형식이 올바르지 않습니다: ${hex}`);
  const n = Number.parseInt(match[1]!, 16);
  const r = channel((n >> 16) & 0xff);
  const g = channel((n >> 8) & 0xff);
  const b = channel(n & 0xff);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
```

`src/ui/contrast.test.ts` 는 알려진 값으로 검증합니다. 검정과 흰색은 21:1, 같은 색끼리는 1:1 입니다. `#777777` 과 흰색은 약 4.48:1 이라 AA 에 아슬하게 미달합니다. 이 세 가지를 테스트로 두십시오.

- [ ] **Step 2: 색 토큰을 ui.css 에 정의**

`src/assets/ui.css` 의 `:root` 에 아래 토큰을 둡니다. 색의 유일한 출처입니다.

```css
:root {
  --bg: #14161a;
  --surface: #1c1f24;
  --surface-raised: #262b32;
  --border: #3a414a;
  --text: #e8eaed;
  --text-dim: #a8b0ba;
  --accent: #4a9eff;
  --on-accent: #08131f;
  --danger: #ff8a8a;
}
```

값을 바꾸고 싶으면 바꾸되, Step 3 의 검사를 통과해야 합니다.

- [ ] **Step 3: 테마 대비 검사 테스트**

`src/ui/theme.test.ts` 는 `node:fs` 로 `src/assets/ui.css` 를 읽어 토큰을 뽑고 대비를 계산합니다. CSS 를 유일한 출처로 두면서도 검사할 수 있는 방법입니다. `src/core/coreBoundary.test.ts` 가 같은 방식을 씁니다.

검사할 짝과 기준입니다.

| 앞 | 뒤 | 최소 |
|---|---|---|
| `--text` | `--bg` | 4.5 |
| `--text` | `--surface` | 4.5 |
| `--text` | `--surface-raised` | 4.5 |
| `--text-dim` | `--bg` | 4.5 |
| `--text-dim` | `--surface` | 4.5 |
| `--accent` | `--bg` | 3 |
| `--on-accent` | `--accent` | 4.5 |
| `--border` | `--bg` | 3 |

`--text-dim` 에도 4.5 를 요구하는 이유는 그것이 장식이 아니라 읽어야 하는 보조 문구에 쓰이기 때문입니다. `--accent` 와 `--border` 는 글자가 아니라 경계와 표시에 쓰므로 비텍스트 기준 3:1 입니다.

토큰이 하나라도 빠지면 실패하게 하십시오. 토큰을 지우고 검사가 통과하면 검사가 아무것도 붙잡지 못합니다.

- [ ] **Step 4: 인라인 스타일을 CSS 로 옮기기**

`App.tsx`, `Rail.tsx`, `SettingsPanel.tsx`, `OptionField.tsx`, `DropZone.tsx` 의 `style={{ ... }}` 에 박힌 색과 배치를 `ui.css` 의 클래스로 옮깁니다. 색은 반드시 `var(--토큰)` 으로 참조하십시오. 클래스 이름은 `hs-` 로 시작하게 해 다른 스타일과 섞이지 않게 합니다.

`body` 에 `background: var(--bg)` 와 `color: var(--text)` 를 둡니다. `color-scheme: dark` 도 두어 브라우저 기본 폼 요소가 어두운 쪽으로 그려지게 하십시오. 이것을 빼면 `input` 과 `select` 만 밝게 남습니다.

초점 표시를 지우지 마십시오. `outline: none` 을 쓰지 말고, 필요하면 `:focus-visible` 에 더 잘 보이는 표시를 주십시오.

- [ ] **Step 5: index.html 손보기**

`<title>` 은 배포 작업에서 이미 도구 용도를 담게 바뀌었습니다. 그대로 두십시오. `<meta name="theme-color" content="#14161a">` 를 더하고, `#root` 안의 소개 내용이 어두운 배경에서도 읽히는지 확인하십시오. 소개 내용의 색이 인라인으로 박혀 있으면 토큰을 쓰도록 고치십시오.

- [ ] **Step 6: 검사와 눈으로 확인**

Run: `npx tsc --noEmit && npm test && npm run build`

개발 서버에서 확인할 것입니다.

- 첫 화면이 어둡습니다.
- 초점 표시가 모든 조작 요소에서 보입니다.
- `input[type=color]` 와 `select` 가 어두운 배경에서 읽힙니다.

- [ ] **Step 7: 커밋**

```bash
git add src/ui/contrast.ts src/ui/contrast.test.ts src/ui/theme.test.ts src/assets/ui.css src/ui/App.tsx src/ui/Rail.tsx src/ui/SettingsPanel.tsx src/ui/OptionField.tsx src/ui/DropZone.tsx index.html
git commit -m "어두운 테마 색 토큰과 명암 대비 검사 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## Task 6: 접근성 마무리

**Files:**
- Modify: `src/ui/App.tsx`, `src/ui/usePipeline.ts`, `src/core/layout/types.ts` 또는 `src/core/render/buildScene.ts`

**Interfaces:**
- Consumes: 앞선 모든 작업
- Produces: `Scene` 에서 그려진 문자열을 모으는 방법

- [ ] **Step 1: 캔버스 이름표를 그려진 글에서 만들기**

지금 캔버스 `aria-label` 은 고정 문구입니다. 스펙은 프레임에 그린 문자열과 **같은 출처**에서 만들라고 합니다. 따로 지으면 보이는 것과 읽어주는 것이 어긋납니다.

`Scene` 의 `nodes` 에서 `kind === 'text'` 인 노드의 `text` 를 순서대로 모으는 함수를 `src/core/render/` 에 만드십시오. 순수 함수이므로 `*.test.ts` 로 검증됩니다.

```ts
export function sceneText(scene: Scene): readonly string[] {
  return scene.nodes.filter((n) => n.kind === 'text').map((n) => n.text);
}
```

`usePipeline` 이 마지막으로 그린 `Scene` 을 들고 있다가 그 결과를 돌려주고, `App.tsx` 가 `t('canvas.withFrame', { text: texts.join(', ') })` 로 이름표를 만듭니다. 사진이 없으면 `t('canvas.empty')` 입니다.

- [ ] **Step 2: 검사**

Run: `npx tsc --noEmit && npm test`

- [ ] **Step 3: 키보드만으로 한 바퀴 돌기**

개발 서버에서 마우스를 쓰지 않고 다음을 해 보고 보고서에 적으십시오.

1. 탭 키로 사진 고르기 단추에 닿아 파일을 넣습니다.
2. 레일로 이동해 화살표로 네 칸을 오갑니다.
3. 프리셋을 바꿉니다.
4. 옵션 하나를 바꿉니다.
5. 내보내기 칸으로 가서 크기를 고르고 내려받습니다.

중간에 초점이 사라지거나 순서가 튀는 자리가 있으면 그 자리를 적으십시오.

- [ ] **Step 4: 커밋**

```bash
git add src/core/render src/ui/App.tsx src/ui/usePipeline.ts
git commit -m "캔버스 이름표를 그려진 글에서 만들기

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## 범위 밖으로 남기는 것

- 영어 사전. 스펙이 이번에는 한국어만 채우라고 했습니다.
- 브랜드 로고와 촬영 정보 확인 창. 계획 3-3 입니다.
- 화면 컴포넌트 렌더 테스트. DOM 구현체가 새 의존성이라 넣지 않습니다.
- 옵션끼리 얽힌 제약(예: `PAD_BOTTOM` 이 좁은데 `SUB_SCALE` 이 큰 조합)을 막는 일. 지금은 각 값의 min/max 만 있습니다.
- `probeCanvasLimit` 을 워커로 옮기는 일.
