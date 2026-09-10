# CSS 작업 지침

이 문서는 `src/assets/ui.css` 와 화면 컴포넌트에 CSS 를 쓸 때 지키는 규약입니다.
규칙마다 왜 그런지를 함께 적었습니다. 이유를 알아야 여기 안 적힌 상황에서도 같은
방향으로 판단할 수 있습니다.

## 이 문서가 있는 이유

3-2 단계 화면 본체 작업은 여섯 번에 걸쳐 진행되었고, 회차마다 그때 필요한 만큼
CSS 를 따로 썼습니다. 공유 체계 없이 늘어난 자리는 간격과 모서리입니다. `ui.css`
에 실제로 쓰인 값을 세어 보면 간격은 1px, 4px, 6px, 8px, 10px, 12px, 14px, 16px,
24px 아홉 가지이고 모서리는 0, 2px, 4px, 6px, 8px, 12px, 50% 일곱 가지입니다.
색만 `:root` 토큰과 `src/ui/theme.test.ts` 의 명암비 검사로 묶여 있었고, 나머지는
그 규칙을 쓴 자리에서 그때그때 정한 숫자였습니다.

간격과 모서리에도 같은 방식의 토큰과 검사를 두는 것이 이 문서가 다루는 전부입니다.
새 규칙을 만드는 것이 아니라 이미 정해진 값을 한곳에 모읍니다.

## 색

색은 `ui.css` 의 `:root` 와 `[data-theme='light']` 에 있는 아홉 토큰(`--bg`,
`--surface`, `--surface-raised`, `--border`, `--text`, `--text-dim`, `--accent`,
`--on-accent`, `--danger`)만 씁니다. 새 토큰이 필요하면 두 블록 모두에 정의하고
`src/ui/theme.test.ts` 의 `REQUIRED_TOKENS` 배열에 더합니다. 다른 색 위에 놓여
읽혀야 하는 짝이면 `PAIRS` 배열에도 더합니다. 글자에 쓰는 짝은 4.5:1, 경계나
표시처럼 글자가 아닌 짝은 WCAG 비텍스트 기준 3:1을 최소로 둡니다.

값은 `#` 뒤에 정확히 6자리 16진수로 씁니다. `theme.test.ts` 가 토큰을 뽑는
정규식이 그 형태만 잡기 때문입니다. `#fff` 나 `rgb(...)` 로 쓰면 오류 없이
조용히 검사 대상에서 빠지고, 명암비가 나빠도 어떤 테스트도 실패하지 않습니다.

## 치수

간격, 모서리, 글자 크기에 쓰는 토큰 열한 개입니다. `src/ui/scale.test.ts` 가 두 가지를
검사합니다. `ui.css` 에 이 값들이 정확히 선언되어 있는지, 그리고 `padding`, `margin`,
`gap`, `border-radius`, `font-size` 어디에도 이 토큰 밖의 값이 쓰이지 않는지입니다.
계열도 함께 봅니다. `font-size: var(--space-3)` 처럼 섞어 쓰면 실패합니다.

| 토큰 | 값 |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--radius-sm` | 4px |
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--text-sm` | 12px |
| `--text-md` | 13px |
| `--text-lg` | 20px |

`--space-5`(20px)는 없습니다. 쓰는 자리가 없는 단계는 선언하지 않습니다. 실제로
20px 이 필요해지면 그때 더합니다.

## 어느 단계를 어디에

- **조작 요소 안쪽**: 세로 `--space-2`, 가로 `--space-3`. 단추와 입력 상자의
  안쪽 여백입니다.
- **같은 묶음 안 항목 사이**: `--space-2`. 목록 항목 사이, 아이콘과 글자 사이
  같은 것입니다.
- **묶음과 묶음 사이**: `--space-3`. 필드 하나와 다음 필드 사이입니다.
- **구역 안쪽**: `--space-4`. 패널이나 카드 전체를 감싸는 여백입니다.

모서리는 **안쪽이 바깥쪽보다 한 단계 아래**입니다. `--radius-lg` 상자 안의
항목은 `--radius-md`, `--radius-md` 상자 안의 항목은 `--radius-sm` 입니다.
`.hs-colorpicker-panel`(12px)과 그 안의 `.hs-colorpicker-pad`(8px),
`.preset-item`(8px)과 그 안의 `.hs-radio-box`(4px)가 이미 이 관계입니다.
안쪽과 바깥쪽 모서리를 같은 값으로 두면 두 모서리가 겹쳐 보여 상자 하나가 아니라
이어 붙은 조각처럼 보입니다.

## 크기

새로 만드는 조작 요소는 `min-height: 32px` 이상, 아이콘만 있는 단추는 44px 이상으로
잡습니다. WCAG 2.5.8 이 요구하는 24x24 를 넉넉히 넘기는 값입니다. `.rail-tab` 과
`.theme-toggle` 이 44px, `.hs-text-input`, `.hs-listbox-trigger`, `.hs-button` 이
32px 을 씁니다.

**아직 이 값에 못 미치는 자리가 셋 있습니다.** `.photo-select-all` 은 `min-height` 가
없어 계산 높이가 약 28px 이고, `.hs-number-btn` 과 `.hs-colorpicker-close` 는 28px 짜리
아이콘 단추입니다. 셋 다 WCAG 의 24x24 는 넘기므로 접근성 위반은 아니지만 이 문서가
정한 값에는 못 미칩니다. 그 자리를 고칠 일이 생기면 함께 올리십시오.

`src/ui/scale.test.ts` 는 `min-height` 를 보지 않습니다. 이 규칙은 사람이 지킵니다.

## 상태는 `data-*` 로

React 가 상태를 `data-*` 속성으로 찍고 CSS 는 그 속성만 읽습니다. `data-selected`,
`data-theme`, `data-selected`, `data-disabled`, `data-placement`,
`data-orientation`, `data-active` 가 이 방식입니다.

`:checked` 와 `:has()` 로 상태를 읽지 않습니다. 라디오와 체크박스 계열 컨트롤은
실제 `<input>` 을 sr-only 로 감추고 곁에 보이는 표시자(`.hs-radio-box` 같은)를
따로 그리는 구조입니다. `:checked` 는 화면에 보이지 않는 그 입력에만 걸리므로
보이는 표시자에는 닿지 않습니다. 형제 선택자로 우회할 수는 있지만, 그러면
마크업 순서가 스타일을 결정하게 됩니다. `data-selected` 를 표시자를 감싸는
요소에 React 가 직접 찍으면 마크업이 바뀌어도 스타일이 그대로 따라옵니다.

## 감추기

`display: none` 과 `visibility: hidden` 은 초점을 받지 못해 키보드 이동과 화면
낭독기 읽기가 끊깁니다. 화면에서만 감추려면 `.hs-radio-input` 의 sr-only
방식(1px 상자로 접고 `clip-path: inset(50%)` 로 자르는 것)을 씁니다.

`hidden` 속성으로 여닫는 자리는 다릅니다. `display` 를 이미 선언해 둔 요소에
`[hidden]` 을 쓰려면 `[hidden] { display: none }` 을 따로 써야 합니다. 저작자
스타일시트의 규칙이 원점 우선순위로 브라우저 기본 `[hidden]` 규칙을 덮어쓰기
때문입니다. `.settings-panel` 이 실제로 이것에 걸렸습니다. 탭 패턴을 지키려고
패널 넷을 모두 그리고 고르지 않은 것만 `hidden` 으로 감추는데,
`.settings-panel` 이 `display: grid` 를 선언해 둔 탓에 감춘 패널도 계속 grid 로
그려져 서로 겹쳐 보였습니다.

```css
.settings-panel[hidden] {
  display: none;
}
```

## 초점

`outline: none` 을 쓰지 않습니다. 전역 `:focus-visible` 규칙이 모든 조작
요소에 같은 표시를 물려줍니다. 입력을 sr-only 로 감춘 자리는 초점 표시를 보이는
쪽으로 옮겨 그립니다. 곁에 별도의 표시자 요소가 있으면 형제 선택자를 씁니다.

```css
.hs-radio-input:focus-visible + .hs-radio-box {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

표시자 요소 없이 감싸는 요소 자체가 보이는 표면이면(`.file-picker` 처럼 라벨이
곧 단추 모양인 경우) 형제 선택자가 닿지 않으므로 `:has()` 를 씁니다.

```css
.file-picker:has(:focus-visible) {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```

이것은 "상태는 `data-*` 로" 규칙과 다투지 않습니다. 여기서 `:has()` 로 읽는
것은 브라우저가 계산하는 초점 상태이지, React 가 관리하는 선택 상태가
아닙니다.

## 구분선

선택 표시에 `border-color` 를 쓰는 요소는 항목 사이 구분선을 `border` 가
아니라 `box-shadow` 로 그립니다. 두 규칙이 같은 속성을 놓고 다투면 나중에
적용되는 쪽이 이겨 다른 쪽이 조용히 사라집니다. `.rail-tab` 이 이 모양입니다.

```css
.rail-tab[data-selected='true'] {
  background: var(--surface-raised);
  border-color: var(--border);
}

.rail-tab:not(:last-child) {
  box-shadow: 1px 0 0 0 var(--border);
}
```

선택 여부는 `border-color` 가, 단추 사이 구분선은 `box-shadow` 가 그리므로
서로 겹치지 않습니다.

## 인라인 `style`

`style` 속성에는 실행 중에 계산되는 값만 넣습니다. 그 밖의 값은 `ui.css` 로
갑니다.

- 색 견본의 배경색: `ColorPicker.tsx` 의 `style={{ backgroundColor: value }}`.
  사용자가 고른 임의의 색이라 미리 정할 수 없습니다.
- 색 판 손잡이의 위치: `style={{ left: ..., top: ... }}`. 마우스가 움직일
  때마다 계산됩니다.
- 포털로 띄운 목록의 좌표. 화면 크기와 트리거 위치에 따라 매번 달라집니다.

고정된 값이나, 조건에 따라 몇 가지 중 하나를 고르는 값은 `data-*` 와 CSS 규칙
으로 갑니다. 그런 값을 `style` 로 넣으면 같은 요소의 스타일이 컴포넌트 코드와
`ui.css` 두 곳으로 갈라져 한쪽만 고치기 쉬워집니다.

## 브라우저별 가상 요소

`::-webkit-*` 와 `::-moz-*` 를 한 선택자 목록에 묶지 않습니다. 브라우저는
선택자 목록 중 하나라도 자신이 모르는 것이면 목록 전체를 무효로 처리합니다.
슬라이더 손잡이가 벤더마다 가상 요소 이름이 달라(`::-webkit-slider-thumb` /
`::-moz-range-thumb`) 이 때문에 규칙이 따로 있습니다.

```css
.hs-slider-input::-webkit-slider-thumb { /* ... */ }
.hs-slider-input::-moz-range-thumb { /* ... */ }
```

같은 벤더 접두사끼리는 묶어도 됩니다. `.hs-number-input::-webkit-inner-spin-button`
과 `::-webkit-outer-spin-button` 은 둘 다 웹킷 전용이라 한 선택자 목록에 있어도
무효화되지 않습니다.

## 눈으로 확인할 것

화면 마크업을 지키는 자동 검사가 없습니다. 테스트 환경이 `node` 라 렌더
테스트를 만들 수 없기 때문입니다. 사람이 보는 것이 유일한 안전망이므로 아래를
형식적으로 넘기지 않습니다.

- 어두운 테마와 밝은 테마 둘 다 확인합니다.
- 767px 아래로 좁혀 배치가 세로로 바뀌는지 확인합니다.
- Tab 키로 화면 전체를 한 바퀴 돌며 초점 표시가 모든 조작 요소에 보이는지
  확인합니다.
- 설정 칸을 스크롤하고, 펼친 목록(Listbox)이 화면 아래를 넘기지 않고 위로
  뒤집히는지 확인합니다.

확인하지 못한 항목은 확인하지 못했다고 적습니다. 확인했다고 적는 것이 가장
나쁩니다.
