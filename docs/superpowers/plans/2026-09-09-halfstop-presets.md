# halfstop 레이아웃과 프리셋 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사진을 넣고 프리셋 아홉 개를 바꿔가며 보고 내려받을 수 있게 합니다.

**Architecture:** 프리셋마다 함수를 만들지 않습니다. 레이아웃 함수는 `bar` 와 `matte` 둘이고, 각 함수가 배치 모드와 텍스트 슬롯을 옵션으로 받습니다. 프리셋 아홉 개는 그 위의 옵션 값 묶음, 즉 데이터입니다. 그래서 프리셋을 늘리거나 버리는 데 코드가 들지 않고, 사용자가 값을 바꿔 만든 변형도 같은 모양으로 저장됩니다.

**Tech Stack:** TypeScript 7, React 19, Vitest 4. 새 의존성 없음.

## Global Constraints

- 작업 디렉터리는 `/Users/kimkm/코드싸게/exifframe`, 브랜치는 `render-pipeline` 입니다.
- `src/core/` 아래 코드는 `react` 를 import 하지 않고 `document`, `window`, `localStorage` 를 직접 참조하지 않습니다. 캔버스가 필요하면 `OffscreenCanvas` 를 씁니다.
- DOM 에 묶인 코드는 `src/platform/`, `src/ui/`, 진입점 `src/main.tsx` 에만 둡니다.
- `src/worker/` 는 `src/ui/` 나 `src/platform/` 을 import 하지 않습니다.
- 이미지를 서버로 보내지 않습니다. 네트워크 요청을 만드는 코드를 넣지 않습니다.
- 한국어 문구는 화면에 보이는 것까지 모두 습니다체로 씁니다. 해요체를 쓰지 않습니다.
- 코드 주석도 습니다체입니다. em-dash(U+2014)와 en-dash(U+2013)를 쓰지 않습니다.
- 커밋 메시지 제목은 명사구로 씁니다.
- 새 의존성을 추가하지 않습니다.
- `tsconfig.json` 에 `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes` 가 켜져 있습니다.
- 옵션에서 크기를 뜻하는 값의 단위는 픽셀이 아니라 디자인 단위입니다. `1u = 사진 짧은 변 / 1000` 입니다.
- 프레임에 그릴 수 있는 값은 촬영 설정과 장비명뿐입니다. GPS, 소유자명, 일련번호는 읽지도 표시하지도 않습니다.
- 이 계획의 범위에 브랜드 로고, i18n, 아이콘 레일, 어두운 테마는 들어가지 않습니다. 다음 계획에서 다룹니다.

---

## File Structure

```
src/core/layout/slots.ts              슬롯 옵션을 읽어 템플릿을 해석
src/core/layout/layouts/bar.ts        하단 정보 바 (기존 presets/infoBar.ts 를 옮겨 확장)
src/core/layout/layouts/matte.ts      4면 여백 액자
src/core/layout/presets.ts            프리셋 아홉 개 정의와 조회
src/platform/settingsStore.ts         고른 프리셋과 옵션 값을 localStorage 에 보관
src/ui/App.tsx                        프리셋 고르는 자리 추가 (임시 형태)
src/ui/usePipeline.ts                 고른 프리셋의 레이아웃과 값을 쓰도록 변경
```

`src/core/layout/presets/infoBar.ts` 는 `src/core/layout/layouts/bar.ts` 로 옮기고 그 디렉터리는 없앱니다. 지금 이름이 `presets` 인데 실제로는 레이아웃 함수라 이름과 내용이 어긋납니다.

---

### Task 1: 슬롯 해석

두 레이아웃 함수가 같은 방식으로 텍스트 슬롯을 읽습니다. 그 부분만 떼어 순수 함수로 둡니다.

**Files:**
- Create: `src/core/layout/slots.ts`
- Test: `src/core/layout/slots.test.ts`

**Interfaces:**
- Consumes: `src/core/layout/template.ts` 의 `renderTemplate`. `src/core/layout/types.ts` 의 `OptionValue` 와 `TemplateToken`
- Produces: `interface ResolvedSlot { main: string; sub: string }`, `type SlotName = 'PRIMARY' | 'SECONDARY'`, `function resolveSlot(options, slot, fields, divider): ResolvedSlot`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/slots.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resolveSlot } from './slots';
import type { OptionValue } from './types';

const FIELDS = { MAKER: 'Canon', BODY: 'EOS R6', MM: '50mm', F: 'f/2.8' } as const;

function opts(entries: Record<string, OptionValue>): Map<string, OptionValue> {
  return new Map(Object.entries(entries));
}

describe('resolveSlot', () => {
  it('주 줄과 부 줄을 각각 해석합니다', () => {
    const values = opts({ PRIMARY_MAIN: '{MAKER}{BODY}', PRIMARY_SUB: '{MM}{F}' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '·')).toEqual({
      main: 'Canon · EOS R6',
      sub: '50mm · f/2.8',
    });
  });

  it('부 줄이 비면 빈 문자열입니다', () => {
    const values = opts({ PRIMARY_MAIN: '{MAKER}', PRIMARY_SUB: '' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '·')).toEqual({ main: 'Canon', sub: '' });
  });

  it('값이 없는 토큰만 있으면 그 줄이 빕니다', () => {
    const values = opts({ PRIMARY_MAIN: '{LENS}', PRIMARY_SUB: '{ISO}' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '·')).toEqual({ main: '', sub: '' });
  });

  it('SECONDARY 슬롯도 같은 방식으로 읽습니다', () => {
    const values = opts({ SECONDARY_MAIN: '{MM}', SECONDARY_SUB: '{F}' });
    expect(resolveSlot(values, 'SECONDARY', FIELDS, '·')).toEqual({ main: '50mm', sub: 'f/2.8' });
  });

  it('옵션 키가 아예 없으면 빈 줄로 봅니다', () => {
    expect(resolveSlot(opts({}), 'PRIMARY', FIELDS, '·')).toEqual({ main: '', sub: '' });
  });

  it('구분자를 그대로 전달합니다', () => {
    const values = opts({ PRIMARY_MAIN: '{MAKER}{BODY}', PRIMARY_SUB: '' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '|').main).toBe('Canon | EOS R6');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/core/layout/slots.test.ts`
Expected: `Cannot find module './slots'` 또는 `Failed to resolve import`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/slots.ts`:

```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/core/layout/slots.test.ts`
Expected: `6 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/slots.ts src/core/layout/slots.test.ts
git commit -m "텍스트 슬롯 해석 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: 하단 바 레이아웃 확장

기존 `src/core/layout/presets/infoBar.ts` 를 `src/core/layout/layouts/bar.ts` 로 옮기고 배치 모드와 슬롯을 붙입니다. **새로 만들지 말고 옮겨서 고칩니다.** 기존 테스트는 `split` 모드의 회귀 테스트로 살립니다.

**Files:**
- Create: `src/core/layout/layouts/bar.ts`, `src/core/layout/layouts/bar.test.ts`
- Delete: `src/core/layout/presets/infoBar.ts`, `src/core/layout/presets/infoBar.test.ts`

**Interfaces:**
- Consumes: `slots.ts` 의 `resolveSlot`, `options.ts` 의 `num`/`str`/`PresetOption`, `primitives.ts` 의 `ellipsize`, `paint/fontFamilies.ts` 의 `FONT_IDS`/`DEFAULT_FONT_ID`/`fontById`/`fontStack`
- Produces: `const BAR_OPTIONS: PresetOption[]`, `const barLayout: PresetLayout`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/layouts/bar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { BAR_OPTIONS, barLayout } from './bar';
import { defaultValues } from '../options';
import type { LayoutInput, LayoutServices, SceneNode } from '../types';

const services: LayoutServices = {
  measureText: (text, style) => text.length * style.size * 0.5,
  hasLogo: () => false,
};

function input(overrides: Partial<LayoutInput> = {}): LayoutInput {
  return {
    photo: { width: 1500, height: 1000 },
    fields: {
      MAKER: 'Canon',
      BODY: 'EOS R6',
      LENS: 'RF 50mm',
      MM: '50mm',
      F: 'f/2.8',
      SEC: '1/250s',
      ISO: 'ISO 400',
    },
    logoId: undefined,
    options: defaultValues(BAR_OPTIONS),
    ...overrides,
  };
}

function texts(nodes: SceneNode[]): string[] {
  return nodes.filter((n) => n.kind === 'text').map((n) => n.text);
}

function textNodes(nodes: SceneNode[]) {
  return nodes.filter((n) => n.kind === 'text');
}

describe('barLayout split 모드', () => {
  it('사진 아래에 바 높이만큼 캔버스를 늘립니다', () => {
    const scene = barLayout(input(), services);
    expect(scene.width).toBe(1500);
    expect(scene.height).toBe(1000 + 120);
  });

  it('사진을 원점에 원본 크기로 놓습니다', () => {
    const scene = barLayout(input(), services);
    expect(scene.nodes.find((n) => n.kind === 'image')).toEqual({
      kind: 'image',
      x: 0,
      y: 0,
      w: 1500,
      h: 1000,
    });
  });

  it('좌우 주 줄을 만듭니다', () => {
    const scene = barLayout(input(), services);
    expect(texts(scene.nodes)).toEqual(['Canon · EOS R6', '50mm · f/2.8 · 1/250s · ISO 400']);
  });

  it('왼쪽은 왼쪽 정렬, 오른쪽은 오른쪽 정렬입니다', () => {
    const scene = barLayout(input(), services);
    const [left, right] = textNodes(scene.nodes);
    expect(left?.style.align).toBe('left');
    expect(right?.style.align).toBe('right');
  });

  it('부 줄을 넣으면 슬롯마다 두 줄이 됩니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('PRIMARY_SUB', '{LENS}');
    const scene = barLayout(input({ options }), services);
    expect(texts(scene.nodes)).toContain('RF 50mm');
    expect(textNodes(scene.nodes)).toHaveLength(3);
  });

  it('부 줄은 주 줄보다 작습니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('PRIMARY_SUB', '{LENS}');
    const scene = barLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    const main = nodes.find((n) => n.text === 'Canon · EOS R6');
    const sub = nodes.find((n) => n.text === 'RF 50mm');
    expect(sub?.style.size).toBeLessThan(main?.style.size ?? 0);
  });

  it('FOOTER 를 넣으면 가운데 아래에 한 줄이 더 생깁니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('FOOTER', '{ISO}');
    const scene = barLayout(input({ options }), services);
    const footer = textNodes(scene.nodes).find((n) => n.text === 'ISO 400');
    expect(footer?.style.align).toBe('center');
    expect(footer?.x).toBe(750);
  });
});

describe('barLayout single 모드', () => {
  it('가운데 정렬이면 한 덩어리가 가운데에 놓입니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'center');
    const scene = barLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.style.align).toBe('center');
    expect(nodes[0]?.x).toBe(750);
  });

  it('왼쪽 정렬이면 여백만큼 들어와서 시작합니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'left');
    const scene = barLayout(input({ options }), services);
    const node = textNodes(scene.nodes)[0];
    expect(node?.style.align).toBe('left');
    expect(node?.x).toBe(60);
  });

  it('오른쪽 정렬이면 오른쪽 여백에서 끝납니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'right');
    const scene = barLayout(input({ options }), services);
    expect(textNodes(scene.nodes)[0]?.x).toBe(1440);
  });

  it('SECONDARY 슬롯은 쓰지 않습니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    const scene = barLayout(input({ options }), services);
    expect(texts(scene.nodes)).not.toContain('50mm · f/2.8 · 1/250s · ISO 400');
  });
});

describe('barLayout 공통', () => {
  it('배경색 옵션이 Scene 배경에 반영됩니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('BACKGROUND', '#000000');
    expect(barLayout(input({ options }), services).background).toBe('#000000');
  });

  it('바 높이 옵션이 캔버스 높이에 반영됩니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('BAR_HEIGHT', 300);
    expect(barLayout(input({ options }), services).height).toBe(1300);
  });

  it('사진 크기가 달라도 같은 옵션이면 바 높이가 같습니다', () => {
    const wide = barLayout(input({ photo: { width: 3000, height: 1000 } }), services);
    const square = barLayout(input({ photo: { width: 1000, height: 1000 } }), services);
    expect(wide.height - 1000).toBe(square.height - 1000);
  });

  it('기본 서체는 Inter 입니다', () => {
    const scene = barLayout(input(), services);
    expect(textNodes(scene.nodes)[0]?.style.family).toContain('Inter');
  });

  it('서체 옵션을 바꾸면 텍스트 스타일이 따라갑니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('FONT_FAMILY', 'jetbrains-mono');
    const scene = barLayout(input({ options }), services);
    expect(textNodes(scene.nodes)[0]?.style.family).toContain('JetBrains');
  });

  it('로고가 있으면 logo 노드를 만듭니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const scene = barLayout(input({ logoId: 'canon' }), withLogo);
    expect(scene.nodes.find((n) => n.kind === 'logo')).toMatchObject({ logoId: 'canon' });
  });

  it('로고가 없으면 logo 노드를 만들지 않습니다', () => {
    const scene = barLayout(input({ logoId: 'canon' }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/core/layout/layouts/bar.test.ts`
Expected: `Cannot find module './bar'`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/layouts/bar.ts`:

```ts
import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { num, str, type PresetOption } from '../options';
import { ellipsize } from '../primitives';
import { resolveSlot } from '../slots';
import { renderTemplate } from '../template';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const BAR_OPTIONS: PresetOption[] = [
  { id: 'MODE', type: 'select', options: ['split', 'single'], default: 'split' },
  { id: 'ALIGN', type: 'select', options: ['left', 'center', 'right'], default: 'center' },
  { id: 'BACKGROUND', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', type: 'color', default: '#111111' },
  { id: 'BAR_HEIGHT', type: 'number', default: 120, unit: 'u' },
  { id: 'SIDE_PADDING', type: 'number', default: 60, unit: 'u' },
  { id: 'FONT_SIZE', type: 'number', default: 34, unit: 'u' },
  { id: 'SUB_SCALE', type: 'range', min: 0.4, max: 1, step: 0.05, default: 0.7 },
  { id: 'FONT_WEIGHT', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  { id: 'DIVIDER', type: 'text', default: '·' },
  { id: 'PRIMARY_MAIN', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'PRIMARY_SUB', type: 'text', default: '' },
  { id: 'SECONDARY_MAIN', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
  { id: 'SECONDARY_SUB', type: 'text', default: '' },
  { id: 'FOOTER', type: 'text', default: '' },
];

export const barLayout: PresetLayout = (input, services) => {
  const options = input.options;
  const barHeight = num(options, 'BAR_HEIGHT');
  const padding = num(options, 'SIDE_PADDING');
  const fontSize = num(options, 'FONT_SIZE');
  const subSize = fontSize * num(options, 'SUB_SCALE');
  const textColor = str(options, 'TEXT_COLOR');
  const divider = str(options, 'DIVIDER');
  const mode = str(options, 'MODE');

  const family = fontStack(fontById(str(options, 'FONT_FAMILY')));
  const weight = num(options, 'FONT_WEIGHT');
  const style = (size: number, align: TextStyle['align']): TextStyle => ({
    family,
    size,
    weight,
    style: 'normal',
    color: textColor,
    align,
    baseline: 'middle',
    alpha: 1,
  });

  const photoWidth = input.photo.width;
  const photoHeight = input.photo.height;
  const nodes: SceneNode[] = [{ kind: 'image', x: 0, y: 0, w: photoWidth, h: photoHeight }];

  const showLogo = input.logoId !== undefined && services.hasLogo(input.logoId);
  const logoWidth = barHeight * 0.6;
  const logoGap = showLogo ? logoWidth + padding * 0.4 : 0;

  const footerText = renderTemplate(str(options, 'FOOTER'), input.fields, divider);
  // 꼬리 줄이 있으면 바를 위아래로 나눠 위쪽에 슬롯을, 아래쪽에 꼬리를 둡니다.
  const footerHeight = footerText ? barHeight * 0.32 : 0;
  const slotHeight = barHeight - footerHeight;
  const slotCenterY = photoHeight + slotHeight / 2;

  if (showLogo && input.logoId !== undefined) {
    const logoHeight = barHeight * 0.4;
    nodes.push({
      kind: 'logo',
      x: padding,
      y: slotCenterY - logoHeight / 2,
      w: logoWidth,
      h: logoHeight,
      logoId: input.logoId,
      fill: textColor,
    });
  }

  /** 주 줄과 부 줄을 세로 가운데를 기준으로 벌려 놓습니다. */
  const push = (slot: 'PRIMARY' | 'SECONDARY', x: number, align: TextStyle['align'], width: number) => {
    const resolved = resolveSlot(options, slot, input.fields, divider);
    const gap = fontSize * 1.25;
    const twoLines = resolved.main !== '' && resolved.sub !== '';

    if (resolved.main) {
      const mainStyle = style(fontSize, align);
      const text = ellipsize(resolved.main, width, mainStyle, services);
      if (text) {
        nodes.push({ kind: 'text', x, y: twoLines ? slotCenterY - gap / 2 : slotCenterY, text, style: mainStyle });
      }
    }
    if (resolved.sub) {
      const subStyle = style(subSize, align);
      const text = ellipsize(resolved.sub, width, subStyle, services);
      if (text) {
        nodes.push({ kind: 'text', x, y: twoLines ? slotCenterY + gap / 2 : slotCenterY, text, style: subStyle });
      }
    }
  };

  if (mode === 'single') {
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const width = photoWidth - padding * 2 - logoGap;
    const x =
      align === 'left' ? padding + logoGap : align === 'right' ? photoWidth - padding : photoWidth / 2;
    push('PRIMARY', x, align, width);
  } else {
    // 좌우 텍스트가 만나지 않도록 각자 절반보다 조금 좁은 폭을 갖습니다.
    const half = (photoWidth - padding * 2 - logoGap) / 2 - padding * 0.25;
    push('PRIMARY', padding + logoGap, 'left', half);
    push('SECONDARY', photoWidth - padding, 'right', half);
  }

  if (footerText) {
    const footerStyle = style(subSize, 'center');
    const text = ellipsize(footerText, photoWidth - padding * 2, footerStyle, services);
    if (text) {
      nodes.push({
        kind: 'text',
        x: photoWidth / 2,
        y: photoHeight + slotHeight + footerHeight / 2,
        text,
        style: footerStyle,
      });
    }
  }

  return {
    width: photoWidth,
    height: photoHeight + barHeight,
    background: str(options, 'BACKGROUND'),
    nodes,
  };
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/core/layout/layouts/bar.test.ts`
Expected: `18 passed`.

- [ ] **Step 5: 옛 파일 지우고 참조 고치기**

```bash
git rm src/core/layout/presets/infoBar.ts src/core/layout/presets/infoBar.test.ts
```

`src/ui/usePipeline.ts` 와 `src/ui/App.tsx` 에서 `INFO_BAR_OPTIONS` 와 `infoBarLayout` 을 import 하고 있습니다. 잠시 `BAR_OPTIONS` 와 `barLayout` 으로 바꿔 두면 됩니다. Task 6 에서 프리셋 레지스트리로 다시 바뀝니다.

```ts
import { BAR_OPTIONS, barLayout } from '../core/layout/layouts/bar';
```

`INFO_BAR_OPTIONS` 를 쓰던 자리는 `BAR_OPTIONS` 로, `infoBarLayout` 을 쓰던 자리는 `barLayout` 으로 바꿉니다.

- [ ] **Step 6: 타입 검사와 전체 테스트**

Run: `npx tsc --noEmit && npm test`
Expected: 타입 오류 없음, 모든 테스트 통과.

- [ ] **Step 7: 커밋**

```bash
git add -A src/core/layout src/ui
git commit -m "하단 바 레이아웃에 배치 모드와 슬롯 추가

프리셋마다 함수를 두지 않기 위해 배치 모드와 텍스트 슬롯을 옵션으로 받습니다.
파일 이름이 presets 였는데 실제로는 레이아웃 함수라 layouts 로 옮겼습니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: 액자 레이아웃

사진 사방에 여백을 두고 아래 여백 안에 글을 넣습니다. 면마다 여백을 따로 받으므로 이 함수 하나로 폴라로이드, 레터박스, 포스터가 모두 나옵니다.

**Files:**
- Create: `src/core/layout/layouts/matte.ts`, `src/core/layout/layouts/matte.test.ts`

**Interfaces:**
- Consumes: Task 1 의 `resolveSlot`, `options.ts` 의 `num`/`str`/`PresetOption`, `primitives.ts` 의 `ellipsize`, `paint/fontFamilies.ts`
- Produces: `const MATTE_OPTIONS: PresetOption[]`, `const matteLayout: PresetLayout`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/layouts/matte.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { MATTE_OPTIONS, matteLayout } from './matte';
import { defaultValues } from '../options';
import type { LayoutInput, LayoutServices, SceneNode } from '../types';

const services: LayoutServices = {
  measureText: (text, style) => text.length * style.size * 0.5,
  hasLogo: () => false,
};

function input(overrides: Partial<LayoutInput> = {}): LayoutInput {
  return {
    photo: { width: 1500, height: 1000 },
    fields: { MAKER: 'Canon', BODY: 'EOS R6', MM: '50mm', TAKEN_AT: '2026-09-09' },
    logoId: undefined,
    options: defaultValues(MATTE_OPTIONS),
    ...overrides,
  };
}

function textNodes(nodes: SceneNode[]) {
  return nodes.filter((n) => n.kind === 'text');
}

describe('matteLayout', () => {
  it('사방 여백만큼 캔버스가 사진보다 커집니다', () => {
    const scene = matteLayout(input(), services);
    // 기본 여백은 위 60, 오른쪽 60, 아래 200, 왼쪽 60 입니다.
    expect(scene.width).toBe(1500 + 60 + 60);
    expect(scene.height).toBe(1000 + 60 + 200);
  });

  it('사진을 왼쪽 위 여백만큼 밀어 놓습니다', () => {
    const scene = matteLayout(input(), services);
    expect(scene.nodes.find((n) => n.kind === 'image')).toEqual({
      kind: 'image',
      x: 60,
      y: 60,
      w: 1500,
      h: 1000,
    });
  });

  it('면마다 여백을 따로 받습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('PAD_LEFT', 0);
    options.set('PAD_RIGHT', 0);
    options.set('PAD_TOP', 150);
    options.set('PAD_BOTTOM', 150);
    const scene = matteLayout(input({ options }), services);
    expect(scene.width).toBe(1500);
    expect(scene.height).toBe(1000 + 300);
    expect(scene.nodes.find((n) => n.kind === 'image')).toMatchObject({ x: 0, y: 150 });
  });

  it('split 모드는 아래 여백에 좌우 두 덩어리를 놓습니다', () => {
    const scene = matteLayout(input(), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes.map((n) => n.style.align)).toEqual(['left', 'right']);
  });

  it('single 모드는 한 덩어리만 놓습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'center');
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.style.align).toBe('center');
  });

  it('poster 모드는 세 줄을 세로로 쌓고 가운데가 가장 큽니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PRIMARY_MAIN', '{TAKEN_AT}');
    options.set('PRIMARY_SUB', '여름의 끝');
    options.set('SECONDARY_MAIN', '{MAKER}{BODY}');
    options.set('SUB_SCALE', 2);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes.map((n) => n.text)).toEqual(['2026-09-09', '여름의 끝', 'Canon · EOS R6']);
    expect(nodes[1]?.style.size).toBeGreaterThan(nodes[0]?.style.size ?? 0);
    expect(nodes[1]?.style.size).toBeGreaterThan(nodes[2]?.style.size ?? 0);
  });

  it('poster 모드의 세 줄은 위에서 아래로 내려갑니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PRIMARY_SUB', '여름의 끝');
    const scene = matteLayout(input({ options }), services);
    const ys = textNodes(scene.nodes).map((n) => n.y);
    expect(ys[0]).toBeLessThan(ys[1] ?? 0);
    expect(ys[1]).toBeLessThan(ys[2] ?? 0);
  });

  it('배경색 옵션이 Scene 배경에 반영됩니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('BACKGROUND', '#000000');
    expect(matteLayout(input({ options }), services).background).toBe('#000000');
  });

  it('사진 크기가 달라도 같은 옵션이면 여백이 같습니다', () => {
    const wide = matteLayout(input({ photo: { width: 3000, height: 1000 } }), services);
    const square = matteLayout(input({ photo: { width: 1000, height: 1000 } }), services);
    expect(wide.height - 1000).toBe(square.height - 1000);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/core/layout/layouts/matte.test.ts`
Expected: `Cannot find module './matte'`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/layouts/matte.ts`:

```ts
import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { num, str, type PresetOption } from '../options';
import { ellipsize } from '../primitives';
import { resolveSlot } from '../slots';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const MATTE_OPTIONS: PresetOption[] = [
  { id: 'MODE', type: 'select', options: ['split', 'single', 'poster'], default: 'split' },
  { id: 'ALIGN', type: 'select', options: ['left', 'center', 'right'], default: 'center' },
  { id: 'BACKGROUND', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', type: 'color', default: '#111111' },
  { id: 'PAD_TOP', type: 'number', default: 60, unit: 'u' },
  { id: 'PAD_RIGHT', type: 'number', default: 60, unit: 'u' },
  { id: 'PAD_BOTTOM', type: 'number', default: 200, unit: 'u' },
  { id: 'PAD_LEFT', type: 'number', default: 60, unit: 'u' },
  { id: 'FONT_SIZE', type: 'number', default: 30, unit: 'u' },
  // poster 에서는 가운데 줄이 커야 하므로 1보다 큰 값도 받습니다.
  { id: 'SUB_SCALE', type: 'range', min: 0.4, max: 3, step: 0.05, default: 0.7 },
  { id: 'FONT_WEIGHT', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  { id: 'DIVIDER', type: 'text', default: '·' },
  { id: 'PRIMARY_MAIN', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'PRIMARY_SUB', type: 'text', default: '' },
  { id: 'SECONDARY_MAIN', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
  { id: 'SECONDARY_SUB', type: 'text', default: '' },
];

export const matteLayout: PresetLayout = (input, services) => {
  const options = input.options;
  const padTop = num(options, 'PAD_TOP');
  const padRight = num(options, 'PAD_RIGHT');
  const padBottom = num(options, 'PAD_BOTTOM');
  const padLeft = num(options, 'PAD_LEFT');
  const fontSize = num(options, 'FONT_SIZE');
  const subSize = fontSize * num(options, 'SUB_SCALE');
  const textColor = str(options, 'TEXT_COLOR');
  const divider = str(options, 'DIVIDER');
  const mode = str(options, 'MODE');

  const family = fontStack(fontById(str(options, 'FONT_FAMILY')));
  const weight = num(options, 'FONT_WEIGHT');
  const style = (size: number, align: TextStyle['align']): TextStyle => ({
    family,
    size,
    weight,
    style: 'normal',
    color: textColor,
    align,
    baseline: 'middle',
    alpha: 1,
  });

  const photoWidth = input.photo.width;
  const photoHeight = input.photo.height;
  const width = photoWidth + padLeft + padRight;
  const height = photoHeight + padTop + padBottom;

  const nodes: SceneNode[] = [
    { kind: 'image', x: padLeft, y: padTop, w: photoWidth, h: photoHeight },
  ];

  // 글은 아래 여백 안에만 놓습니다.
  const areaTop = padTop + photoHeight;
  const areaCenterY = areaTop + padBottom / 2;
  const textWidth = width - padLeft - padRight;

  const primary = resolveSlot(options, 'PRIMARY', input.fields, divider);
  const secondary = resolveSlot(options, 'SECONDARY', input.fields, divider);

  const put = (text: string, size: number, align: TextStyle['align'], x: number, y: number, max: number) => {
    if (!text) return;
    const textStyle = style(size, align);
    const clipped = ellipsize(text, max, textStyle, services);
    if (clipped) nodes.push({ kind: 'text', x, y, text: clipped, style: textStyle });
  };

  if (mode === 'poster') {
    // 위 작게, 가운데 크게, 아래 작게. 세 줄을 아래 여백 안에 세로로 나눕니다.
    const step = padBottom / 4;
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const x = align === 'left' ? padLeft : align === 'right' ? width - padRight : width / 2;
    put(primary.main, fontSize, align, x, areaTop + step, textWidth);
    put(primary.sub, subSize, align, x, areaTop + step * 2, textWidth);
    put(secondary.main, fontSize, align, x, areaTop + step * 3, textWidth);
  } else if (mode === 'single') {
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const x = align === 'left' ? padLeft : align === 'right' ? width - padRight : width / 2;
    const gap = fontSize * 1.25;
    const twoLines = primary.main !== '' && primary.sub !== '';
    put(primary.main, fontSize, align, x, twoLines ? areaCenterY - gap / 2 : areaCenterY, textWidth);
    put(primary.sub, subSize, align, x, twoLines ? areaCenterY + gap / 2 : areaCenterY, textWidth);
  } else {
    const half = textWidth / 2 - fontSize;
    const gap = fontSize * 1.25;
    const leftTwo = primary.main !== '' && primary.sub !== '';
    put(primary.main, fontSize, 'left', padLeft, leftTwo ? areaCenterY - gap / 2 : areaCenterY, half);
    put(primary.sub, subSize, 'left', padLeft, leftTwo ? areaCenterY + gap / 2 : areaCenterY, half);
    const rightTwo = secondary.main !== '' && secondary.sub !== '';
    const rx = width - padRight;
    put(secondary.main, fontSize, 'right', rx, rightTwo ? areaCenterY - gap / 2 : areaCenterY, half);
    put(secondary.sub, subSize, 'right', rx, rightTwo ? areaCenterY + gap / 2 : areaCenterY, half);
  }

  return { width, height, background: str(options, 'BACKGROUND'), nodes };
};
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/core/layout/layouts/matte.test.ts`
Expected: `9 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/layouts/matte.ts src/core/layout/layouts/matte.test.ts
git commit -m "4면 여백 액자 레이아웃 추가

면마다 여백을 따로 받으므로 이 함수 하나로 폴라로이드와 레터박스와 포스터가
모두 나옵니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: 프리셋 아홉 개

프리셋은 레이아웃과 옵션 값 묶음입니다. 코드가 아니라 데이터입니다.

**Files:**
- Create: `src/core/layout/presets.ts`, `src/core/layout/presets.test.ts`

**Interfaces:**
- Consumes: Task 2 의 `BAR_OPTIONS`/`barLayout`, Task 3 의 `MATTE_OPTIONS`/`matteLayout`, `options.ts` 의 `PresetOption`/`OptionValue`/`mergeValues`
- Modifies: `src/core/layout/options.ts` 의 `mergeValues` 에 시작값 인자를 더합니다 (Step 3 참고)
- Produces: `interface Preset { id: string; label: string; layout: 'bar' | 'matte'; values: Record<string, OptionValue> }`, `const PRESETS: readonly Preset[]`, `const DEFAULT_PRESET_ID`, `function presetById(id: string): Preset`, `function optionsFor(preset: Preset): readonly PresetOption[]`, `function layoutFor(preset: Preset): PresetLayout`, `function valuesFor(preset: Preset, stored: Record<string, unknown>): Map<string, OptionValue>`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/presets.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  PRESETS,
  layoutFor,
  optionsFor,
  presetById,
  valuesFor,
} from './presets';
import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';

describe('PRESETS', () => {
  it('아홉 개입니다', () => {
    expect(PRESETS).toHaveLength(9);
  });

  it('id 가 겹치지 않습니다', () => {
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(9);
  });

  it('바 계열이 여섯, 액자 계열이 셋입니다', () => {
    expect(PRESETS.filter((p) => p.layout === 'bar')).toHaveLength(6);
    expect(PRESETS.filter((p) => p.layout === 'matte')).toHaveLength(3);
  });

  it('모든 프리셋에 사람이 읽는 이름이 있습니다', () => {
    for (const preset of PRESETS) {
      expect(preset.label.length).toBeGreaterThan(0);
    }
  });

  it('선언에 없는 옵션 키를 값 묶음에 넣지 않습니다', () => {
    for (const preset of PRESETS) {
      const declared = new Set(optionsFor(preset).map((o) => o.id));
      for (const key of Object.keys(preset.values)) {
        expect(declared.has(key), `${preset.id} 의 ${key}`).toBe(true);
      }
    }
  });
});

describe('presetById', () => {
  it('id 로 찾습니다', () => {
    expect(presetById(DEFAULT_PRESET_ID).id).toBe(DEFAULT_PRESET_ID);
  });

  it('모르는 id 는 기본 프리셋으로 떨어집니다', () => {
    expect(presetById('없는-id').id).toBe(DEFAULT_PRESET_ID);
  });
});

describe('optionsFor 와 layoutFor', () => {
  it('레이아웃에 맞는 선언과 함수를 돌려줍니다', () => {
    const bar = PRESETS.find((p) => p.layout === 'bar')!;
    const matte = PRESETS.find((p) => p.layout === 'matte')!;
    expect(optionsFor(bar)).toBe(BAR_OPTIONS);
    expect(layoutFor(bar)).toBe(barLayout);
    expect(optionsFor(matte)).toBe(MATTE_OPTIONS);
    expect(layoutFor(matte)).toBe(matteLayout);
  });
});

describe('valuesFor', () => {
  it('프리셋 값이 선언 기본값을 덮습니다', () => {
    const preset = presetById('minimal');
    const values = valuesFor(preset, {});
    expect(values.get('MODE')).toBe('single');
  });

  it('저장된 값이 프리셋 값을 덮습니다', () => {
    const preset = presetById('minimal');
    const values = valuesFor(preset, { BAR_HEIGHT: 300 });
    expect(values.get('BAR_HEIGHT')).toBe(300);
    expect(values.get('MODE')).toBe('single');
  });

  it('저장된 값이 이상하면 선언 기본값이 아니라 프리셋 값으로 떨어집니다', () => {
    const preset = presetById('minimal');
    const clean = valuesFor(preset, {});
    const dirty = valuesFor(preset, { BAR_HEIGHT: '높게', GHOST: 1 });
    // 미니멀은 바 높이를 80 으로 덮습니다. 선언 기본값 120 으로 돌아가면 안 됩니다.
    expect(dirty.get('BAR_HEIGHT')).toBe(clean.get('BAR_HEIGHT'));
    expect(dirty.get('BAR_HEIGHT')).toBe(80);
    expect(dirty.has('GHOST')).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/core/layout/presets.test.ts`
Expected: `Cannot find module './presets'`.

- [ ] **Step 3: `mergeValues` 에 시작값 인자 더하기**

값이 세 겹으로 쌓입니다. 선언 기본값, 프리셋 값, 저장된 값 순입니다. 그런데 지금
`mergeValues` 는 언제나 선언 기본값에서 시작합니다. 그래서 프리셋 값과 저장된 값을 한 객체로
합쳐 넘기면, **저장된 값 하나가 이상할 때 그 자리가 프리셋 값이 아니라 선언 기본값으로
떨어집니다.** 미니멀 프리셋의 바 높이 80 이 120 으로 돌아가는 식입니다.

`src/core/layout/options.ts` 의 `mergeValues` 를 이렇게 고칩니다. 기본 인자를 두므로 기존
호출자와 테스트는 그대로 통과합니다.

```ts
export function mergeValues(
  options: readonly PresetOption[],
  stored: Record<string, unknown>,
  base: ReadonlyMap<string, OptionValue> = defaultValues(options),
): Map<string, OptionValue> {
  const values = new Map(base);
  for (const option of options) {
    if (!Object.hasOwn(stored, option.id)) continue;
    const coerced = coerce(option, stored[option.id]);
    if (coerced !== undefined) values.set(option.id, coerced);
  }
  return values;
}
```

`src/core/layout/options.test.ts` 에 이 성질을 고정하는 테스트를 더합니다.

```ts
  it('시작값을 주면 그 위에 덮습니다', () => {
    const base = defaultValues(SCHEMA);
    base.set('BAR_HEIGHT_LIKE', 0);
    const withBase = mergeValues(SCHEMA, { BACKGROUND: '#000000' }, defaultValues(SCHEMA));
    expect(withBase.get('BACKGROUND')).toBe('#000000');
  });

  it('시작값이 있으면 이상한 저장값이 선언 기본값이 아니라 시작값으로 떨어집니다', () => {
    const base = mergeValues(SCHEMA, { BAR_HEIGHT: 80 });
    const merged = mergeValues(SCHEMA, { BAR_HEIGHT: '높게' }, base);
    expect(merged.get('BAR_HEIGHT')).toBe(80);
  });
```

**`SCHEMA` 에 `BAR_HEIGHT` 가 없으면 그 이름을 기존 스키마에 있는 숫자 옵션으로 바꾸세요.**
기존 테스트 파일의 `SCHEMA` 정의를 먼저 읽고 맞추십시오. 첫 번째 테스트의 `base.set` 줄은
쓰지 않는 값이므로 지우고 씁니다.

Run: `npm test -- src/core/layout/options.test.ts`
Expected: 기존 테스트와 새 테스트가 모두 통과합니다.

- [ ] **Step 4: 구현 작성**

`src/core/layout/presets.ts`:

```ts
import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';
import { mergeValues, type OptionValue, type PresetOption } from './options';
import type { PresetLayout } from './types';

export interface Preset {
  id: string;
  /** 지금은 한국어 문자열입니다. 다음 계획에서 번역 키로 바뀝니다. */
  label: string;
  layout: 'bar' | 'matte';
  /** 레이아웃 선언의 기본값 위에 덮어쓸 값입니다. */
  values: Record<string, OptionValue>;
}

export const PRESETS: readonly Preset[] = [
  {
    id: 'body-lens',
    label: '바디와 렌즈',
    layout: 'bar',
    values: {
      MODE: 'split',
      PRIMARY_MAIN: '{MAKER}',
      PRIMARY_SUB: '{BODY}',
      SECONDARY_MAIN: '{LENS}',
      SECONDARY_SUB: '',
      FOOTER: '{MM}{F}{SEC}{ISO}',
      BAR_HEIGHT: 170,
    },
  },
  {
    id: 'gear-exposure',
    label: '장비와 노출',
    layout: 'bar',
    values: {
      MODE: 'split',
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '{LENS}',
      SECONDARY_MAIN: '{MM}{F}',
      SECONDARY_SUB: '{SEC}{ISO}',
      FOOTER: '',
      BAR_HEIGHT: 140,
    },
  },
  {
    id: 'one-line',
    label: '한 줄',
    layout: 'bar',
    values: {
      MODE: 'single',
      ALIGN: 'center',
      PRIMARY_MAIN: '{MAKER}{BODY}{MM}{F}{SEC}{ISO}',
      PRIMARY_SUB: '',
      BAR_HEIGHT: 90,
      FONT_SIZE: 28,
    },
  },
  {
    id: 'shot-on',
    label: 'Shot on',
    layout: 'bar',
    values: {
      MODE: 'single',
      ALIGN: 'center',
      PRIMARY_MAIN: 'Shot on {MAKER}{BODY}',
      PRIMARY_SUB: '{MM}{F}{SEC}{ISO}',
      BAR_HEIGHT: 160,
      FONT_SIZE: 40,
      FONT_WEIGHT: 600,
      SUB_SCALE: 0.55,
    },
  },
  {
    id: 'minimal',
    label: '미니멀',
    layout: 'bar',
    values: {
      MODE: 'single',
      ALIGN: 'left',
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '',
      BAR_HEIGHT: 80,
      FONT_SIZE: 24,
      FONT_WEIGHT: 300,
      TEXT_COLOR: '#888888',
      DIVIDER: '',
    },
  },
  {
    id: 'film',
    label: '필름 데이터백',
    layout: 'bar',
    values: {
      MODE: 'split',
      PRIMARY_MAIN: '{TAKEN_AT}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      BACKGROUND: '#000000',
      TEXT_COLOR: '#ff9500',
      FONT_FAMILY: 'jetbrains-mono',
      FONT_SIZE: 30,
      BAR_HEIGHT: 100,
      DIVIDER: '',
    },
  },
  {
    id: 'polaroid',
    label: '폴라로이드',
    layout: 'matte',
    values: {
      MODE: 'split',
      PAD_TOP: 70,
      PAD_RIGHT: 70,
      PAD_BOTTOM: 240,
      PAD_LEFT: 70,
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
    },
  },
  {
    id: 'letterbox',
    label: '레터박스',
    layout: 'matte',
    values: {
      MODE: 'single',
      ALIGN: 'center',
      PAD_TOP: 160,
      PAD_RIGHT: 0,
      PAD_BOTTOM: 160,
      PAD_LEFT: 0,
      BACKGROUND: '#000000',
      TEXT_COLOR: '#c8c8c8',
      PRIMARY_MAIN: '{MAKER}{BODY}{MM}{F}',
      PRIMARY_SUB: '',
      FONT_SIZE: 26,
    },
  },
  {
    id: 'poster',
    label: '포스터',
    layout: 'matte',
    values: {
      MODE: 'poster',
      ALIGN: 'left',
      PAD_TOP: 120,
      PAD_RIGHT: 120,
      PAD_BOTTOM: 420,
      PAD_LEFT: 120,
      BACKGROUND: '#f4f2ee',
      PRIMARY_MAIN: '{TAKEN_AT}',
      PRIMARY_SUB: '제목을 입력하십시오',
      SECONDARY_MAIN: '{MAKER}{BODY}{MM}',
      SECONDARY_SUB: '',
      FONT_SIZE: 26,
      SUB_SCALE: 2.6,
    },
  },
];

export const DEFAULT_PRESET_ID = 'body-lens';

/** 저장된 설정에 없는 id 가 남아 있어도 화면이 비지 않도록 기본값으로 떨어집니다. */
export function presetById(id: string): Preset {
  return PRESETS.find((preset) => preset.id === id) ?? PRESETS[0]!;
}

export function optionsFor(preset: Preset): readonly PresetOption[] {
  return preset.layout === 'bar' ? BAR_OPTIONS : MATTE_OPTIONS;
}

export function layoutFor(preset: Preset): PresetLayout {
  return preset.layout === 'bar' ? barLayout : matteLayout;
}

/**
 * 값은 세 겹으로 쌓입니다. 레이아웃 선언의 기본값, 프리셋이 덮는 값, 사용자가 저장한 값
 * 순입니다. 저장된 값은 낡았거나 손으로 고쳤을 수 있으므로 mergeValues 가 걸러냅니다.
 */
export function valuesFor(
  preset: Preset,
  stored: Record<string, unknown>,
): Map<string, OptionValue> {
  const declared = optionsFor(preset);
  // 두 번에 나눠 덮습니다. 한 객체로 합쳐 넘기면 저장된 값 하나가 이상할 때 그 자리가
  // 프리셋 값이 아니라 선언 기본값으로 떨어집니다.
  const base = mergeValues(declared, preset.values);
  return mergeValues(declared, stored, base);
}
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test -- src/core/layout/presets.test.ts`
Expected: `11 passed`.

- [ ] **Step 6: 커밋**

```bash
git add src/core/layout/presets.ts src/core/layout/presets.test.ts src/core/layout/options.ts src/core/layout/options.test.ts
git commit -m "프리셋 아홉 개 정의 추가

프리셋은 레이아웃과 옵션 값 묶음입니다. 코드가 아니라 데이터라 늘리거나 버리는 데
비용이 들지 않습니다.

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: 설정 저장

고른 프리셋과 그 위에서 바꾼 값을 브라우저에 남깁니다.

**Files:**
- Create: `src/platform/settingsStore.ts`, `src/platform/settingsStore.test.ts`

**Interfaces:**
- Consumes: 없음. `localStorage` 를 인자로 받습니다.
- Produces: `interface StoredSettings { presetId: string; values: Record<string, unknown> }`, `interface StorageLike { getItem(key: string): string | null; setItem(key: string, value: string): void }`, `function readSettings(storage?: StorageLike): StoredSettings | null`, `function writeSettings(settings: StoredSettings, storage?: StorageLike): void`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/platform/settingsStore.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readSettings, writeSettings, type StorageLike } from './settingsStore';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

function throwingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error('사생활 보호 모드');
    },
    setItem: () => {
      throw new Error('사생활 보호 모드');
    },
  };
}

describe('writeSettings 와 readSettings', () => {
  it('쓴 것을 그대로 읽습니다', () => {
    const storage = fakeStorage();
    writeSettings({ presetId: 'minimal', values: { BAR_HEIGHT: 300 } }, storage);
    expect(readSettings(storage)).toEqual({ presetId: 'minimal', values: { BAR_HEIGHT: 300 } });
  });

  it('저장된 것이 없으면 null 입니다', () => {
    expect(readSettings(fakeStorage())).toBeNull();
  });

  it('JSON 이 깨져 있으면 null 입니다', () => {
    expect(readSettings(fakeStorage({ 'halfstop.settings.v1': '{{{' }))).toBeNull();
  });

  it('presetId 가 문자열이 아니면 null 입니다', () => {
    const storage = fakeStorage({ 'halfstop.settings.v1': '{"presetId":7,"values":{}}' });
    expect(readSettings(storage)).toBeNull();
  });

  it('values 가 객체가 아니면 null 입니다', () => {
    const storage = fakeStorage({ 'halfstop.settings.v1': '{"presetId":"a","values":3}' });
    expect(readSettings(storage)).toBeNull();
  });

  it('읽기가 던져도 null 로 넘어갑니다', () => {
    expect(readSettings(throwingStorage())).toBeNull();
  });

  it('쓰기가 던져도 밖으로 새지 않습니다', () => {
    expect(() => writeSettings({ presetId: 'a', values: {} }, throwingStorage())).not.toThrow();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test -- src/platform/settingsStore.test.ts`
Expected: `Cannot find module './settingsStore'`.

- [ ] **Step 3: 구현 작성**

`src/platform/settingsStore.ts`:

```ts
const KEY = 'halfstop.settings.v1';

export interface StoredSettings {
  presetId: string;
  values: Record<string, unknown>;
}

/** 테스트에서 가짜를 넣을 수 있도록 필요한 두 메서드만 받습니다. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

function browserStorage(): StorageLike {
  return localStorage;
}

/**
 * 저장된 값은 사용자가 직접 고쳤거나 예전 버전이 남긴 것일 수 있습니다. 모양이 어긋나면
 * 통째로 버리고 기본값으로 시작합니다. 개별 값의 검증은 mergeValues 가 맡습니다.
 */
export function readSettings(storage: StorageLike = browserStorage()): StoredSettings | null {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { presetId, values } = parsed as Partial<StoredSettings>;
    if (typeof presetId !== 'string') return null;
    if (typeof values !== 'object' || values === null || Array.isArray(values)) return null;
    return { presetId, values };
  } catch {
    return null;
  }
}

export function writeSettings(
  settings: StoredSettings,
  storage: StorageLike = browserStorage(),
): void {
  try {
    storage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // 사생활 보호 모드에서는 저장이 막힙니다. 설정이 안 남는 것이 도구를 못 쓸 이유는
    // 아니므로 조용히 넘깁니다.
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test -- src/platform/settingsStore.test.ts`
Expected: `7 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/platform/settingsStore.ts src/platform/settingsStore.test.ts
git commit -m "프리셋과 옵션 값 저장 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: 화면에 프리셋 고르는 자리 붙이기

레일과 패널은 다음 계획에서 만듭니다. 여기서는 **지금 화면에 고르는 자리만 붙여** 아홉 개를 실제로 볼 수 있게 합니다.

**Files:**
- Modify: `src/ui/usePipeline.ts`, `src/ui/App.tsx`

**Interfaces:**
- Consumes: Task 4 의 `PRESETS`/`DEFAULT_PRESET_ID`/`presetById`/`optionsFor`/`layoutFor`/`valuesFor`, Task 5 의 `readSettings`/`writeSettings`
- Produces: `usePipeline` 이 `presetId`, `setPreset`, `presetOptions` 를 더 돌려줍니다

- [ ] **Step 1: usePipeline 을 프리셋 기준으로 바꾸기**

`src/ui/usePipeline.ts` 에서 다음을 고칩니다.

import 를 바꿉니다.

```ts
import {
  DEFAULT_PRESET_ID,
  layoutFor,
  optionsFor,
  presetById,
  valuesFor,
} from '../core/layout/presets';
import { readSettings, writeSettings } from '../platform/settingsStore';
```

`BAR_OPTIONS` 와 `barLayout` 을 직접 import 하던 줄은 지웁니다.

상태를 프리셋 기준으로 바꿉니다. 기존의 `options` 초기화를 다음으로 대체합니다.

```ts
  const stored = useMemo(() => readSettings(), []);
  const [presetId, setPresetId] = useState(() => presetById(stored?.presetId ?? DEFAULT_PRESET_ID).id);
  const [options, setOptions] = useState<Map<string, OptionValue>>(() =>
    valuesFor(presetById(stored?.presetId ?? DEFAULT_PRESET_ID), stored?.values ?? {}),
  );

  const preset = useMemo(() => presetById(presetId), [presetId]);
  const presetOptions = useMemo(() => optionsFor(preset), [preset]);
```

프리셋을 바꾸는 함수를 더합니다. **프리셋을 바꾸면 값도 그 프리셋 기준으로 새로 만듭니다.** 이전 프리셋에서 만진 값을 그대로 들고 가면 레이아웃이 달라 뜻이 어긋납니다.

```ts
  const setPreset = useCallback((id: string) => {
    const next = presetById(id);
    setPresetId(next.id);
    setOptions(valuesFor(next, {}));
  }, []);
```

옵션 하나를 바꾸는 기존 `setOption` 은 그대로 둡니다.

저장은 프리셋이나 값이 바뀔 때마다 합니다.

```ts
  useEffect(() => {
    writeSettings({ presetId, values: Object.fromEntries(options) });
  }, [presetId, options]);
```

`buildScene` 을 부르는 두 곳에서 `layout: infoBarLayout` 을 `layout: layoutFor(preset)` 으로 바꿉니다. `repaint` 와 `download` 두 곳입니다. 두 곳 모두 의존성 배열에 `preset` 을 더합니다.

반환값에 셋을 더합니다.

```ts
    presetId,
    setPreset,
    presetOptions,
```

- [ ] **Step 2: App 에 고르는 자리 붙이기**

`src/ui/App.tsx` 에서 다음을 고칩니다.

import 를 바꿉니다. `INFO_BAR_OPTIONS` 를 지우고 `PRESETS` 를 가져옵니다.

```ts
import { PRESETS } from '../core/layout/presets';
```

훅에서 새 값을 받습니다.

```ts
  const { status, options, setOption, load, download, busy, ready, hasPhoto, presetId, setPreset, presetOptions } =
    usePipeline(canvasRef);
```

옵션 목록을 도는 자리에서 `INFO_BAR_OPTIONS` 를 `presetOptions` 로 바꿉니다.

패널 맨 위에 프리셋 고르는 자리를 넣습니다. 레일은 다음 계획에서 만들 것이므로 지금은 목록 하나로 둡니다.

```tsx
          <label style={{ display: 'grid', gap: 4, fontSize: 13, marginBottom: 8 }}>
            <span>프리셋</span>
            <select value={presetId} onChange={(e) => setPreset(e.target.value)}>
              {PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
            </select>
          </label>
```

- [ ] **Step 3: 타입 검사와 전체 테스트**

Run: `npx tsc --noEmit && npm test`
Expected: 타입 오류 없음, 모든 테스트 통과.

- [ ] **Step 4: `src/core/` 격리 확인**

Run: `grep -rn "document\.\|window\.\|localStorage" src/core/`
Expected: 주석에 있는 `document.fonts` 언급 하나 외에는 없습니다. 코드에 걸리는 줄이 있으면 그 파일이 잘못된 자리에 있는 것입니다.

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공하고 `dist/assets/` 에 워커 청크가 나옵니다.

- [ ] **Step 6: 개발 서버로 직접 확인**

Run: `npm run dev`

브라우저에서 다음을 확인하고 결과를 기록합니다.

1. 사진을 넣고 프리셋 목록에서 아홉 개를 차례로 고릅니다. **모두 오류 없이 그려지는지** 봅니다.
2. 액자 계열 셋에서 캔버스가 사진보다 커지는지 봅니다. 포스터가 가장 큽니다.
3. 레터박스에서 좌우 여백이 0이고 위아래만 검은지 봅니다.
4. 필름에서 배경이 검고 글자가 주황이며 고정폭인지 봅니다.
5. 프리셋을 바꾼 뒤 새로고침해서 **그 프리셋이 유지되는지** 봅니다.
6. 옵션을 하나 바꾸고 새로고침해서 그 값이 유지되는지 봅니다.
7. 프리셋을 바꾸면 옵션 목록이 그 레이아웃 것으로 바뀌는지 봅니다. 액자에서는 `PAD_TOP` 같은 항목이 나와야 합니다.
8. 각 프리셋에서 내려받기가 되는지, 받은 파일이 열리는지 봅니다.

- [ ] **Step 7: 커밋**

```bash
git add src/ui
git commit -m "프리셋 고르는 자리와 설정 저장 연결

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## 이 계획을 마치면 확보되는 것

- 사진 한 장으로 프리셋 아홉 개를 바꿔가며 보고 각각 내려받을 수 있습니다.
- 프리셋을 늘리거나 버리는 데 코드가 들지 않습니다. `PRESETS` 배열에 항목 하나입니다.
- 고른 프리셋과 만진 값이 다음 방문까지 남습니다.
- 액자 레이아웃이 생겨 사진 둘레에 여백을 두는 형식을 다룰 수 있습니다.

## 다음 계획에서 다루는 것

**3-2 화면**: i18n 틀과 한국어 사전, 옵션에 사람이 읽는 이름과 묶음, 어두운 테마와 명암 대비, 오른쪽 아이콘 레일과 설정 패널, 좁은 화면의 하단 탭, 캔버스 대체 텍스트와 상태 알림.

**3-3 로고와 확인 창**: 브랜드 정규화, Commons 에서 로고 수집과 `Path2D` 변환 빌드 스텝, 바 계열에서 로고 자리 잡기, 촬영 정보가 없는 사진의 확인 창과 검토 화면.
