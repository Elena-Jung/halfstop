# halfstop 렌더 파이프라인 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** JPEG 한 장을 브라우저에 넣으면 촬영 정보가 담긴 하단 바 프레임을 붙여 파일로 내려받는 경로를 끝까지 완성합니다.

**Architecture:** 프리셋은 캔버스를 만지지 않고 순수 함수 `layout()`으로 `Scene` 트리만 만듭니다. 미리보기는 긴 변 1600px로 축소 디코딩한 비트맵에 그리고, 전체 해상도 디코딩과 인코딩은 내보낼 때만 합니다. `Scene`의 좌표 단위는 픽셀이 아니라 디자인 단위이고 `1u = 사진 짧은 변 / 1000`입니다. 공용 `paint()`가 `ctx.scale(pxPerUnit, pxPerUnit)`을 한 번 걸고 그 트리를 그립니다. 미리보기와 내보내기는 `pxPerUnit`만 다른 같은 호출이므로 두 결과가 어긋날 수 없습니다.

**Tech Stack:** Vite 8, React 19, TypeScript 7, Vitest 4, exifreader 4

## Global Constraints

- 프로젝트 루트는 `/Users/kimkm/코드싸게/exifframe`입니다. 저장소와 패키지 이름은 `halfstop`입니다.
- 이미지를 서버로 보내지 않습니다. 네트워크 요청을 만드는 코드를 넣지 않습니다.
- `src/core/` 아래 코드는 `react`를 import 하지 않고 `document`, `window`, `localStorage`를 직접 참조하지 않습니다. 브라우저가 필요한 기능은 인자로 주입받습니다. 이 규칙이 깨지면 나중에 워커로 옮길 수 없습니다.
- 문서와 주석은 습니다체로 씁니다. em-dash(U+2014)와 en-dash(U+2013)를 쓰지 않습니다.
- 커밋 메시지 제목은 명사구로 씁니다.
- 선행 프로젝트 `jeonghyeon-net/exif-frame`은 GPL-3.0입니다. 그 저장소의 코드와 이미지를 복사해 오지 않습니다.
- 패키지 버전: `vite@^8.2.2`, `react@^19.2.8`, `react-dom@^19.2.8`, `typescript@^7.0.2`, `vitest@^4.1.11`, `@vitejs/plugin-react@^6.1.1`, `exifreader@^4.44.1`
- 이 계획의 범위는 프리셋 한 개(하단 정보 바)입니다. 나머지 두 프리셋과 브랜드 로고, HEIC, RAW, 배치, i18n은 다음 계획에서 다룹니다.

---

## File Structure

```
package.json                          npm 스크립트와 의존성
tsconfig.json                         엄격 모드 TypeScript 설정
vite.config.ts                        Vite와 Vitest 설정
index.html                            SPA 진입점
src/main.tsx                          React 마운트
src/ui/App.tsx                        드롭존, 미리보기 캔버스, 옵션 패널
src/ui/usePipeline.ts                 읽기, 미리보기 갱신, 내보내기 상태

src/core/io/sniff.ts                  매직 바이트로 파일 종류 판별
src/core/io/orientation.ts            EXIF Orientation 변환 수학
src/core/io/autoOrientProbe.ts        브라우저 자동 회전 여부 탐지
src/core/io/decode/index.ts           파일 종류별 디코더 선택
src/core/io/decode/raster.ts          JPEG, PNG, WebP 디코딩과 회전 정규화
src/core/io/decode/resizeHint.ts      미리보기 축소 축 결정

src/core/exif/read.ts                 exifreader 호출
src/core/exif/map.ts                  태그를 PhotoMeta로
src/core/exif/format.ts               PhotoMeta를 표시 문자열로

src/core/layout/types.ts              Scene, SceneNode, TextStyle, LayoutInput
src/core/layout/units.ts              픽셀 크기를 디자인 단위로
src/core/layout/options.ts            PresetOption 선언과 기본값 병합
src/core/layout/template.ts           템플릿 토큰 치환
src/core/layout/primitives.ts         말줄임과 텍스트 배치 보조
src/core/layout/presets/infoBar.ts    하단 정보 바 프리셋

src/core/paint/paint.ts               Scene를 캔버스 컨텍스트에 그리기
src/core/paint/measure.ts             브라우저 measureText 구현

src/core/limits/clampExportSize.ts    내보내기 크기 계산과 한계 적용
src/core/limits/probeCanvasLimit.ts   실제 캔버스 한계 측정

src/core/export/resolution.ts         원본, 4K, 2K, SNS 목표 크기와 미리보기 상한
src/core/export/webpSupport.ts        캔버스 WebP 지원 탐지
src/core/export/encode.ts             캔버스를 Blob으로

src/core/render/buildScene.ts         사진 크기와 옵션을 Scene으로
src/core/render/paintToCanvas.ts      Scene을 캔버스에 그리고 크기를 확정
src/core/render/exportToBlob.ts       전체 해상도 렌더와 인코딩
```

순수 함수는 파일 옆에 `*.test.ts`를 둡니다. 브라우저 API가 필요한 파일은 그 API를 인자로 주입받는 형태로 만들어 테스트 가능한 부분을 분리합니다.

---

### Task 1: 프로젝트 뼈대와 테스트 러너

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/ui/App.tsx`, `src/vite-env.d.ts`
- Test: `src/core/smoke.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `npm test`와 `npm run dev`가 동작하는 저장소

- [ ] **Step 1: package.json 작성**

```json
{
  "name": "halfstop",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=22" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "exifreader": "^4.44.1",
    "react": "^19.2.8",
    "react-dom": "^19.2.8"
  },
  "devDependencies": {
    "@types/node": "^22.19.19",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.1.1",
    "typescript": "^7.0.2",
    "vite": "^8.2.2",
    "vitest": "^4.1.11"
  }
}
```

- [ ] **Step 2: tsconfig.json 작성**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable", "WebWorker"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "types": ["node", "vitest/globals"]
  },
  "include": ["src", "vite.config.ts"]
}
```

`noUncheckedIndexedAccess`는 배열 인덱싱 결과를 `T | undefined`로 만듭니다. 레이아웃 코드가 배열을 많이 다루므로 이 옵션이 실수를 잡아 줍니다.

- [ ] **Step 3: vite.config.ts 작성**

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

테스트 환경을 `node`로 둡니다. `src/core/`는 DOM에 의존하지 않기로 했으므로 jsdom이 필요 없고, jsdom을 깔아 두면 DOM을 쓰는 코드가 core에 섞여도 테스트가 통과해 규칙이 무너집니다.

- [ ] **Step 4: index.html과 React 진입점 작성**

`index.html`:

```html
<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>halfstop</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';

const root = document.getElementById('root');
if (!root) throw new Error('#root 엘리먼트를 찾지 못했습니다');
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`src/ui/App.tsx`:

```tsx
export function App() {
  return <main style={{ fontFamily: 'system-ui', padding: 24 }}>halfstop</main>;
}
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

- [ ] **Step 5: 실패하는 스모크 테스트 작성**

`src/core/smoke.test.ts`:

```ts
import { describe, expect, it } from 'vitest';

describe('테스트 러너', () => {
  it('동작합니다', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: 설치하고 테스트 실행**

```bash
npm install && npm test
```

기대 결과: `1 passed`. 실패하면 여기서 멈추고 원인을 해결합니다. 이후 모든 작업이 이 명령에 기댑니다.

- [ ] **Step 7: 커밋**

```bash
git add -A
git commit -m "프로젝트 뼈대와 테스트 러너 구성

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 2: 매직 바이트 파일 종류 판별

확장자는 믿을 수 없습니다. 아이폰에서 받은 HEIC가 `.jpg`로 저장되어 있는 경우가 흔합니다.

**Files:**
- Create: `src/core/io/sniff.ts`
- Test: `src/core/io/sniff.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `type FileKind = 'jpeg' | 'png' | 'webp' | 'heic' | 'tiff' | 'cr3' | 'unknown'`, `function sniff(head: Uint8Array): FileKind`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/io/sniff.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { sniff } from './sniff';

function bytes(...values: number[]): Uint8Array {
  const buffer = new Uint8Array(32);
  buffer.set(values, 0);
  return buffer;
}

function ftyp(brand: string): Uint8Array {
  const buffer = new Uint8Array(32);
  buffer.set([0x00, 0x00, 0x00, 0x18], 0);
  buffer.set([...'ftyp'].map((c) => c.charCodeAt(0)), 4);
  buffer.set([...brand].map((c) => c.charCodeAt(0)), 8);
  return buffer;
}

describe('sniff', () => {
  it('JPEG을 판별합니다', () => {
    expect(sniff(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg');
  });

  it('PNG를 판별합니다', () => {
    expect(sniff(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('png');
  });

  it('WebP를 판별합니다', () => {
    const buffer = new Uint8Array(32);
    buffer.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0);
    buffer.set([...'WEBP'].map((c) => c.charCodeAt(0)), 8);
    expect(sniff(buffer)).toBe('webp');
  });

  it('HEIC 브랜드들을 판별합니다', () => {
    for (const brand of ['heic', 'heix', 'mif1', 'msf1', 'heim']) {
      expect(sniff(ftyp(brand))).toBe('heic');
    }
  });

  it('CR3를 HEIC와 구분합니다', () => {
    expect(sniff(ftyp('crx '))).toBe('cr3');
  });

  it('리틀엔디언과 빅엔디언 TIFF를 모두 판별합니다', () => {
    expect(sniff(bytes(0x49, 0x49, 0x2a, 0x00))).toBe('tiff');
    expect(sniff(bytes(0x4d, 0x4d, 0x00, 0x2a))).toBe('tiff');
  });

  it('모르는 형식은 unknown입니다', () => {
    expect(sniff(bytes(0x00, 0x01, 0x02, 0x03))).toBe('unknown');
    expect(sniff(new Uint8Array(2))).toBe('unknown');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/io/sniff.test.ts
```

기대 결과: `Failed to resolve import "./sniff"`.

- [ ] **Step 3: 구현 작성**

`src/core/io/sniff.ts`:

```ts
export type FileKind = 'jpeg' | 'png' | 'webp' | 'heic' | 'tiff' | 'cr3' | 'unknown';

/** `sniff`에 넘겨야 하는 최소 바이트 수입니다. */
export const SNIFF_BYTES = 16;

const HEIC_BRANDS = new Set(['heic', 'heix', 'heim', 'heis', 'hevc', 'mif1', 'msf1', 'avif']);

function ascii(head: Uint8Array, start: number, length: number): string {
  let out = '';
  for (let i = 0; i < length; i += 1) {
    const byte = head[start + i];
    if (byte === undefined) return '';
    out += String.fromCharCode(byte);
  }
  return out;
}

function startsWith(head: Uint8Array, signature: number[]): boolean {
  return signature.every((value, index) => head[index] === value);
}

export function sniff(head: Uint8Array): FileKind {
  if (head.length < 12) return 'unknown';

  if (startsWith(head, [0xff, 0xd8, 0xff])) return 'jpeg';
  if (startsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'png';
  if (ascii(head, 0, 4) === 'RIFF' && ascii(head, 8, 4) === 'WEBP') return 'webp';

  if (ascii(head, 4, 4) === 'ftyp') {
    const brand = ascii(head, 8, 4);
    if (brand === 'crx ') return 'cr3';
    if (HEIC_BRANDS.has(brand)) return 'heic';
    return 'unknown';
  }

  // TIFF 헤더는 CR2, NEF, ARW, DNG 같은 RAW 포맷의 공통 뼈대이기도 합니다.
  if (startsWith(head, [0x49, 0x49, 0x2a, 0x00])) return 'tiff';
  if (startsWith(head, [0x4d, 0x4d, 0x00, 0x2a])) return 'tiff';

  return 'unknown';
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/io/sniff.test.ts
```

기대 결과: `7 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/io/sniff.ts src/core/io/sniff.test.ts
git commit -m "매직 바이트 기반 파일 종류 판별 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 3: EXIF Orientation 변환 수학

**Files:**
- Create: `src/core/io/orientation.ts`
- Test: `src/core/io/orientation.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `interface OrientedSize { width: number; height: number; matrix: [number, number, number, number, number, number] }`, `function orientationTransform(orientation: number, width: number, height: number): OrientedSize`, `function swapsAxes(orientation: number): boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/io/orientation.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { orientationTransform, swapsAxes } from './orientation';

describe('orientationTransform', () => {
  it('1은 아무것도 바꾸지 않습니다', () => {
    const result = orientationTransform(1, 400, 300);
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
    expect(result.matrix).toEqual([1, 0, 0, 1, 0, 0]);
  });

  it('6은 가로세로를 바꿉니다', () => {
    const result = orientationTransform(6, 400, 300);
    expect(result.width).toBe(300);
    expect(result.height).toBe(400);
  });

  it('8도 가로세로를 바꿉니다', () => {
    const result = orientationTransform(8, 400, 300);
    expect(result.width).toBe(300);
    expect(result.height).toBe(400);
  });

  it('3은 크기를 유지합니다', () => {
    const result = orientationTransform(3, 400, 300);
    expect(result.width).toBe(400);
    expect(result.height).toBe(300);
  });

  it('알 수 없는 값은 1로 취급합니다', () => {
    expect(orientationTransform(0, 400, 300).matrix).toEqual([1, 0, 0, 1, 0, 0]);
    expect(orientationTransform(99, 400, 300).matrix).toEqual([1, 0, 0, 1, 0, 0]);
  });
});

describe('swapsAxes', () => {
  it('5부터 8까지가 축을 바꿉니다', () => {
    expect([1, 2, 3, 4].map(swapsAxes)).toEqual([false, false, false, false]);
    expect([5, 6, 7, 8].map(swapsAxes)).toEqual([true, true, true, true]);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/io/orientation.test.ts
```

기대 결과: `Failed to resolve import "./orientation"`.

- [ ] **Step 3: 구현 작성**

`src/core/io/orientation.ts`:

```ts
export type Matrix = [number, number, number, number, number, number];

export interface OrientedSize {
  /** 회전을 적용한 뒤의 가로 길이입니다. */
  width: number;
  /** 회전을 적용한 뒤의 세로 길이입니다. */
  height: number;
  /** `ctx.setTransform`에 그대로 넘길 수 있는 행렬입니다. */
  matrix: Matrix;
}

export function swapsAxes(orientation: number): boolean {
  return orientation >= 5 && orientation <= 8;
}

export function orientationTransform(orientation: number, width: number, height: number): OrientedSize {
  const swapped = swapsAxes(orientation);
  const outWidth = swapped ? height : width;
  const outHeight = swapped ? width : height;

  // 각 행렬은 원본 픽셀을 출력 좌표계의 (0,0)-(outWidth,outHeight)로 옮깁니다.
  const matrices: Record<number, Matrix> = {
    1: [1, 0, 0, 1, 0, 0],
    2: [-1, 0, 0, 1, width, 0],
    3: [-1, 0, 0, -1, width, height],
    4: [1, 0, 0, -1, 0, height],
    5: [0, 1, 1, 0, 0, 0],
    6: [0, 1, -1, 0, height, 0],
    7: [0, -1, -1, 0, height, width],
    8: [0, -1, 1, 0, 0, width],
  };

  return { width: outWidth, height: outHeight, matrix: matrices[orientation] ?? matrices[1]! };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/io/orientation.test.ts
```

기대 결과: `6 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/io/orientation.ts src/core/io/orientation.test.ts
git commit -m "EXIF Orientation 변환 행렬 계산 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 4: 브라우저 자동 회전 탐지

브라우저가 `createImageBitmap`에서 Orientation을 이미 적용했는지 알아야 합니다. 모르면 회전을 두 번 적용해 사진이 눕습니다. Orientation=6을 붙인 3x2 JPEG을 만들어 디코딩한 뒤 가로세로가 뒤집혔는지 봅니다.

**Files:**
- Create: `src/core/io/autoOrientProbe.ts`
- Test: `src/core/io/autoOrientProbe.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `function buildOrientation6Jpeg(baseJpeg: Uint8Array): Uint8Array`, `function detectAutoOrientation(decode: (blob: Blob) => Promise<{ width: number; height: number }>, baseJpeg: Uint8Array): Promise<boolean>`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/io/autoOrientProbe.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildOrientation6Jpeg, detectAutoOrientation } from './autoOrientProbe';

/** SOI, 최소한의 SOF0, EOI만 담은 가짜 JPEG입니다. 바이트 삽입 위치만 검증합니다. */
const FAKE_JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x03, 0x00, 0xff, 0xd9]);

describe('buildOrientation6Jpeg', () => {
  it('SOI 바로 뒤에 APP1을 넣습니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    expect([out[0], out[1]]).toEqual([0xff, 0xd8]);
    expect([out[2], out[3]]).toEqual([0xff, 0xe1]);
  });

  it('APP1 길이 필드가 실제 세그먼트 길이와 맞습니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    const declared = (out[4]! << 8) | out[5]!;
    expect(declared).toBe(34);
  });

  it('Exif 식별자와 Orientation 태그를 담습니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    expect(String.fromCharCode(...out.slice(6, 10))).toBe('Exif');
    // 6번지 Exif(6) + 12번지 TIFF 헤더(8) + 20번지 IFD 항목 수(2) 다음이 태그입니다.
    expect([out[20], out[21]]).toEqual([0x01, 0x00]);
    expect([out[22], out[23]]).toEqual([0x12, 0x01]);
    // 태그(2) + 타입(2) + 개수(4) 뒤 30번지에 값 6이 SHORT로 들어갑니다.
    expect([out[30], out[31]]).toEqual([0x06, 0x00]);
  });

  it('APP0이 앞에 있으면 그 뒤에 넣습니다', () => {
    const withApp0 = new Uint8Array([
      0xff, 0xd8,
      0xff, 0xe0, 0x00, 0x10,
      0x4a, 0x46, 0x49, 0x46, 0x00,
      0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00,
      0xff, 0xd9,
    ]);
    const out = buildOrientation6Jpeg(withApp0);
    // APP0 세그먼트는 20번지에서 끝납니다.
    expect([out[20], out[21]]).toEqual([0xff, 0xe1]);
    expect([out[2], out[3]]).toEqual([0xff, 0xe0]);
  });

  it('원본 나머지 바이트를 그대로 뒤에 붙입니다', () => {
    const out = buildOrientation6Jpeg(FAKE_JPEG);
    expect(out.slice(-FAKE_JPEG.length + 2)).toEqual(FAKE_JPEG.slice(2));
    expect(out.length).toBe(FAKE_JPEG.length + 36);
  });
});

describe('detectAutoOrientation', () => {
  it('가로세로가 뒤집혀 오면 자동 회전으로 봅니다', async () => {
    const decode = async () => ({ width: 2, height: 3 });
    await expect(detectAutoOrientation(decode, FAKE_JPEG)).resolves.toBe(true);
  });

  it('원본 그대로 오면 자동 회전이 아닙니다', async () => {
    const decode = async () => ({ width: 3, height: 2 });
    await expect(detectAutoOrientation(decode, FAKE_JPEG)).resolves.toBe(false);
  });

  it('디코딩이 실패하면 자동 회전이 아닌 쪽으로 판단합니다', async () => {
    const decode = async () => {
      throw new Error('decode failed');
    };
    await expect(detectAutoOrientation(decode, FAKE_JPEG)).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/io/autoOrientProbe.test.ts
```

기대 결과: `Failed to resolve import "./autoOrientProbe"`.

- [ ] **Step 3: 구현 작성**

`src/core/io/autoOrientProbe.ts`:

```ts
/**
 * Orientation=6 한 항목만 담은 APP1 세그먼트입니다.
 * FFE1, 길이 34, "Exif\0\0", 리틀엔디언 TIFF 헤더, 항목 1개짜리 IFD0으로 이루어집니다.
 */
const APP1_ORIENTATION_6 = new Uint8Array([
  0xff, 0xe1, 0x00, 0x22,
  0x45, 0x78, 0x69, 0x66, 0x00, 0x00,
  0x49, 0x49, 0x2a, 0x00, 0x08, 0x00, 0x00, 0x00,
  0x01, 0x00,
  0x12, 0x01, 0x03, 0x00, 0x01, 0x00, 0x00, 0x00, 0x06, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

/**
 * SOI 바로 뒤가 기본 위치입니다. 다만 캔버스가 만든 JPEG은 APP0(JFIF)으로 시작하고,
 * APP0보다 앞선 APP1을 무시하는 디코더가 있습니다. 그래서 APP0이 있으면 그 뒤로 넣습니다.
 */
function insertionPoint(jpeg: Uint8Array): number {
  if (jpeg[2] === 0xff && jpeg[3] === 0xe0) {
    const length = ((jpeg[4] ?? 0) << 8) | (jpeg[5] ?? 0);
    return 4 + length;
  }
  return 2;
}

export function buildOrientation6Jpeg(baseJpeg: Uint8Array): Uint8Array {
  const at = insertionPoint(baseJpeg);
  const out = new Uint8Array(baseJpeg.length + APP1_ORIENTATION_6.length);
  out.set(baseJpeg.subarray(0, at), 0);
  out.set(APP1_ORIENTATION_6, at);
  out.set(baseJpeg.subarray(at), at + APP1_ORIENTATION_6.length);
  return out;
}

/**
 * 3x2 JPEG에 Orientation=6을 붙여 디코딩합니다. 브라우저가 회전을 이미 적용했다면
 * 2x3으로 돌아옵니다. 판단이 불가능하면 회전을 적용하지 않은 쪽으로 봅니다.
 * 회전을 두 번 거는 것보다 한 번도 안 거는 쪽이 원인을 찾기 쉽기 때문입니다.
 */
export async function detectAutoOrientation(
  decode: (blob: Blob) => Promise<{ width: number; height: number }>,
  baseJpeg: Uint8Array,
): Promise<boolean> {
  try {
    const tagged = buildOrientation6Jpeg(baseJpeg);
    const blob = new Blob([tagged as BlobPart], { type: 'image/jpeg' });
    const { width, height } = await decode(blob);
    return height > width;
  } catch {
    return false;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/io/autoOrientProbe.test.ts
```

기대 결과: `8 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/io/autoOrientProbe.ts src/core/io/autoOrientProbe.test.ts
git commit -m "브라우저 자동 회전 여부 탐지 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 5: 디자인 단위 변환

**Files:**
- Create: `src/core/layout/units.ts`
- Test: `src/core/layout/units.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `const UNITS_PER_SHORT_EDGE = 1000`, `interface UnitSize { width: number; height: number }`, `function toUnits(pixelWidth: number, pixelHeight: number): UnitSize`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/units.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { toUnits, UNITS_PER_SHORT_EDGE } from './units';

describe('toUnits', () => {
  it('가로 사진의 짧은 변을 1000으로 맞춥니다', () => {
    expect(toUnits(6000, 4000)).toEqual({ width: 1500, height: 1000 });
  });

  it('세로 사진의 짧은 변을 1000으로 맞춥니다', () => {
    expect(toUnits(4000, 6000)).toEqual({ width: 1000, height: 1500 });
  });

  it('정사각형은 양변이 1000입니다', () => {
    expect(toUnits(3000, 3000)).toEqual({ width: 1000, height: 1000 });
  });

  it('화소수가 달라도 비율이 같으면 같은 결과를 냅니다', () => {
    expect(toUnits(1200, 800)).toEqual(toUnits(9000, 6000));
  });

  it('0 이하 입력은 거부합니다', () => {
    expect(() => toUnits(0, 100)).toThrow();
    expect(() => toUnits(100, -1)).toThrow();
  });

  it('상수를 노출합니다', () => {
    expect(UNITS_PER_SHORT_EDGE).toBe(1000);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/layout/units.test.ts
```

기대 결과: `Failed to resolve import "./units"`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/units.ts`:

```ts
/**
 * 사진의 짧은 변이 항상 이 값이 되도록 좌표계를 정합니다.
 * 프리셋 옵션을 절대 픽셀로 두면 1200만 화소 사진과 4500만 화소 사진에서
 * 같은 설정이 다른 결과를 냅니다. 이 정규화가 그 문제를 없앱니다.
 */
export const UNITS_PER_SHORT_EDGE = 1000;

export interface UnitSize {
  width: number;
  height: number;
}

export function toUnits(pixelWidth: number, pixelHeight: number): UnitSize {
  if (pixelWidth <= 0 || pixelHeight <= 0) {
    throw new Error(`사진 크기가 올바르지 않습니다: ${pixelWidth}x${pixelHeight}`);
  }
  const scale = UNITS_PER_SHORT_EDGE / Math.min(pixelWidth, pixelHeight);
  return { width: pixelWidth * scale, height: pixelHeight * scale };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/layout/units.test.ts
```

기대 결과: `6 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/units.ts src/core/layout/units.test.ts
git commit -m "디자인 단위 변환 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 6: Scene 타입 정의

이 파일에는 실행되는 코드가 없습니다. 이후 모든 작업이 여기 정의된 이름에 기대므로 별도 작업으로 둡니다.

**Files:**
- Create: `src/core/layout/types.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `Unit`, `OptionValue`, `TextStyle`, `SceneNode`, `Scene`, `LayoutServices`, `LayoutInput`, `TemplateToken`, `PresetLayout`

- [ ] **Step 1: 타입 작성**

`src/core/layout/types.ts`:

```ts
/** 디자인 단위입니다. 픽셀이 아닙니다. */
export type Unit = number;

/** 프리셋 옵션이 가질 수 있는 값입니다. options.ts가 이 타입을 다시 내보냅니다. */
export type OptionValue = string | number | boolean;

export interface TextStyle {
  family: string;
  size: Unit;
  weight: number;
  style: 'normal' | 'italic';
  color: string;
  align: 'left' | 'center' | 'right';
  baseline: 'top' | 'middle' | 'alphabetic' | 'bottom';
  alpha: number;
}

export type SceneNode =
  | { kind: 'rect'; x: Unit; y: Unit; w: Unit; h: Unit; fill: string; alpha: number }
  | { kind: 'image'; x: Unit; y: Unit; w: Unit; h: Unit }
  | { kind: 'text'; x: Unit; y: Unit; text: string; style: TextStyle }
  | { kind: 'logo'; x: Unit; y: Unit; w: Unit; h: Unit; logoId: string; fill: string };

export interface Scene {
  width: Unit;
  height: Unit;
  background: string;
  nodes: SceneNode[];
}

/**
 * 레이아웃이 순수하지 않게 되는 유일한 두 지점입니다. 주입해서 받습니다.
 * 덕분에 layout()은 캔버스도 DOM도 없이 테스트할 수 있습니다.
 */
export interface LayoutServices {
  /** 반환값의 단위는 디자인 단위입니다. */
  measureText(text: string, style: TextStyle): number;
  /** 로고가 없으면 null을 돌려줍니다. 프리셋은 그때 워드마크로 대체합니다. */
  hasLogo(logoId: string): boolean;
}

export type TemplateToken = 'MAKER' | 'BODY' | 'LENS' | 'MM' | 'F' | 'SEC' | 'ISO' | 'TAKEN_AT';

export interface LayoutInput {
  /** 디자인 단위로 표현한 사진 크기입니다. */
  photo: { width: Unit; height: Unit };
  /** 값이 없는 항목은 undefined입니다. 템플릿에서 통째로 사라집니다. */
  fields: Partial<Record<TemplateToken, string>>;
  /** 바디 브랜드 로고 식별자입니다. 아직 정해지지 않았으면 undefined입니다. */
  logoId: string | undefined;
  options: ReadonlyMap<string, OptionValue>;
}

export type PresetLayout = (input: LayoutInput, services: LayoutServices) => Scene;
```

- [ ] **Step 2: 타입 검사 통과 확인**

```bash
npx tsc -b
```

기대 결과: 출력 없이 종료 코드 0. 이 파일은 다른 모듈을 import 하지 않으므로 단독으로 통과해야 합니다.

- [ ] **Step 3: 커밋**

```bash
git add src/core/layout/types.ts
git commit -m "Scene 트리와 레이아웃 계약 타입 정의

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 7: 프리셋 옵션 선언과 기본값 병합

**Files:**
- Create: `src/core/layout/options.ts`
- Test: `src/core/layout/options.test.ts`

**Interfaces:**
- Consumes: `src/core/layout/types.ts`의 `OptionValue`
- Produces: `type PresetOption`, `function defaultValues(options: readonly PresetOption[]): Map<string, OptionValue>`, `function mergeValues(options: readonly PresetOption[], stored: Record<string, unknown>): Map<string, OptionValue>`, `function num(values, id): number`, `function str(values, id): string`, `function bool(values, id): boolean`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/options.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { bool, defaultValues, mergeValues, num, str, type PresetOption } from './options';

const SCHEMA: PresetOption[] = [
  { id: 'BACKGROUND', type: 'color', default: '#ffffff' },
  { id: 'BAR_HEIGHT', type: 'number', default: 120, unit: 'u' },
  { id: 'SHOW_LOGO', type: 'boolean', default: true },
  { id: 'ALIGN', type: 'select', options: ['left', 'center'], default: 'left' },
  { id: 'WEIGHT', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'LABEL', type: 'text', default: '' },
];

describe('defaultValues', () => {
  it('선언에 적힌 기본값을 그대로 담습니다', () => {
    const values = defaultValues(SCHEMA);
    expect(values.get('BACKGROUND')).toBe('#ffffff');
    expect(values.get('BAR_HEIGHT')).toBe(120);
    expect(values.get('SHOW_LOGO')).toBe(true);
    expect(values.size).toBe(6);
  });
});

describe('mergeValues', () => {
  it('저장된 값으로 덮어씁니다', () => {
    const values = mergeValues(SCHEMA, { BAR_HEIGHT: 200 });
    expect(values.get('BAR_HEIGHT')).toBe(200);
    expect(values.get('BACKGROUND')).toBe('#ffffff');
  });

  it('선언에 없는 키는 버립니다', () => {
    const values = mergeValues(SCHEMA, { GHOST: 1 });
    expect(values.has('GHOST')).toBe(false);
  });

  it('타입이 다른 값은 무시하고 기본값을 씁니다', () => {
    const values = mergeValues(SCHEMA, { BAR_HEIGHT: 'tall', SHOW_LOGO: 'yes' });
    expect(values.get('BAR_HEIGHT')).toBe(120);
    expect(values.get('SHOW_LOGO')).toBe(true);
  });

  it('select 목록에 없는 값은 무시합니다', () => {
    expect(mergeValues(SCHEMA, { ALIGN: 'right' }).get('ALIGN')).toBe('left');
    expect(mergeValues(SCHEMA, { ALIGN: 'center' }).get('ALIGN')).toBe('center');
  });

  it('range 범위를 벗어난 값은 잘라 냅니다', () => {
    expect(mergeValues(SCHEMA, { WEIGHT: 5000 }).get('WEIGHT')).toBe(900);
    expect(mergeValues(SCHEMA, { WEIGHT: 0 }).get('WEIGHT')).toBe(100);
  });

  it('유한하지 않은 수는 무시합니다', () => {
    expect(mergeValues(SCHEMA, { BAR_HEIGHT: Number.NaN }).get('BAR_HEIGHT')).toBe(120);
  });
});

describe('접근 헬퍼', () => {
  it('타입에 맞는 값을 꺼냅니다', () => {
    const values = defaultValues(SCHEMA);
    expect(num(values, 'BAR_HEIGHT')).toBe(120);
    expect(str(values, 'BACKGROUND')).toBe('#ffffff');
    expect(bool(values, 'SHOW_LOGO')).toBe(true);
  });

  it('없는 키를 꺼내면 던집니다', () => {
    const values = defaultValues(SCHEMA);
    expect(() => num(values, 'NOPE')).toThrow('NOPE');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/layout/options.test.ts
```

기대 결과: `Failed to resolve import "./options"`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/options.ts`:

```ts
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
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/layout/options.test.ts
```

기대 결과: `10 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/options.ts src/core/layout/options.test.ts
git commit -m "선언적 프리셋 옵션 스키마와 기본값 병합 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 8: 템플릿 토큰 치환

**규칙:** 템플릿을 `}` 기준으로 자릅니다. 각 조각은 `앞 리터럴 + {토큰}` 형태입니다. 토큰에 값이 없으면 그 조각을 리터럴까지 통째로 버립니다. 살아남은 조각은 앞뒤 공백을 떼고 구분자로 잇습니다. 마지막 `}` 뒤에 남은 리터럴도 하나의 조각으로 봅니다.

**Files:**
- Create: `src/core/layout/template.ts`
- Test: `src/core/layout/template.test.ts`

**Interfaces:**
- Consumes: `src/core/layout/types.ts`의 `TemplateToken`
- Produces: `function renderTemplate(template: string, fields: Partial<Record<TemplateToken, string>>, divider: string): string`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/template.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { renderTemplate } from './template';

const FULL = {
  MAKER: 'Nikon',
  BODY: 'Z 6II',
  LENS: 'NIKKOR Z 35mm f/1.8 S',
  MM: '35mm',
  F: 'f/1.8',
  SEC: '1/250s',
  ISO: 'ISO 400',
  TAKEN_AT: '2026-09-09',
} as const;

describe('renderTemplate', () => {
  it('토큰만 늘어놓으면 구분자로 잇습니다', () => {
    expect(renderTemplate('{MAKER}{BODY}{ISO}', FULL, '·')).toBe('Nikon · Z 6II · ISO 400');
  });

  it('값이 없는 토큰은 구분자까지 함께 사라집니다', () => {
    expect(renderTemplate('{MAKER}{LENS}{ISO}', { MAKER: 'Nikon', ISO: 'ISO 400' }, '·')).toBe(
      'Nikon · ISO 400',
    );
  });

  it('빈 문자열도 값이 없는 것으로 봅니다', () => {
    expect(renderTemplate('{MAKER}{BODY}', { MAKER: 'Nikon', BODY: '   ' }, '·')).toBe('Nikon');
  });

  it('토큰 앞 리터럴은 그 토큰과 운명을 함께합니다', () => {
    expect(renderTemplate('shot on {BODY}', FULL, '·')).toBe('shot on Z 6II');
    expect(renderTemplate('shot on {BODY}', {}, '·')).toBe('');
  });

  it('마지막 토큰 뒤 리터럴은 따로 살아남습니다', () => {
    expect(renderTemplate('{MAKER} 로 촬영', FULL, '·')).toBe('Nikon · 로 촬영');
  });

  it('모르는 토큰은 값이 없는 것으로 봅니다', () => {
    expect(renderTemplate('{MAKER}{GPS}', FULL, '·')).toBe('Nikon');
  });

  it('토큰이 하나도 없으면 리터럴만 남습니다', () => {
    expect(renderTemplate('halfstop', FULL, '·')).toBe('halfstop');
  });

  it('모든 값이 비면 빈 문자열입니다', () => {
    expect(renderTemplate('{MAKER}{BODY}', {}, '·')).toBe('');
  });

  it('구분자가 비면 공백 하나로 잇습니다', () => {
    expect(renderTemplate('{MAKER}{BODY}', FULL, '')).toBe('Nikon Z 6II');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/layout/template.test.ts
```

기대 결과: `Failed to resolve import "./template"`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/template.ts`:

```ts
import type { TemplateToken } from './types';

const SEGMENT = /^(.*?)\{([A-Z_]+)\}$/s;

/**
 * 표시 항목과 순서를 사용자가 문자열 하나로 정하게 합니다. 체크박스 여러 개보다
 * 다루기 쉽고, 값이 비었을 때 구분자가 덩그러니 남는 문제도 여기서 한 번에 해결합니다.
 */
export function renderTemplate(
  template: string,
  fields: Partial<Record<TemplateToken, string>>,
  divider: string,
): string {
  const pieces: string[] = [];
  const chunks = template.split('}');

  for (let i = 0; i < chunks.length; i += 1) {
    const chunk = chunks[i]!;
    const isLast = i === chunks.length - 1;

    if (isLast) {
      const tail = chunk.trim();
      if (tail) pieces.push(tail);
      continue;
    }

    const match = SEGMENT.exec(`${chunk}}`);
    if (!match) {
      // 여는 중괄호가 없는 조각입니다. 리터럴로 취급합니다.
      const literal = chunk.trim();
      if (literal) pieces.push(literal);
      continue;
    }

    const [, literal = '', token = ''] = match;
    const value = fields[token as TemplateToken];
    if (value === undefined || value.trim() === '') continue;

    pieces.push(`${literal}${value}`.trim());
  }

  const joiner = divider.trim() === '' ? ' ' : ` ${divider.trim()} `;
  return pieces.join(joiner);
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/layout/template.test.ts
```

기대 결과: `9 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/template.ts src/core/layout/template.test.ts
git commit -m "템플릿 토큰 치환 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 9: 말줄임 원시 함수

**Files:**
- Create: `src/core/layout/primitives.ts`
- Test: `src/core/layout/primitives.test.ts`

**Interfaces:**
- Consumes: `src/core/layout/types.ts`의 `TextStyle`, `LayoutServices`
- Produces: `function ellipsize(text: string, maxWidth: number, style: TextStyle, services: LayoutServices): string`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/primitives.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { ellipsize } from './primitives';
import type { LayoutServices, TextStyle } from './types';

const STYLE: TextStyle = {
  family: 'Test',
  size: 10,
  weight: 400,
  style: 'normal',
  color: '#000000',
  align: 'left',
  baseline: 'middle',
  alpha: 1,
};

/** 글자 하나를 폭 10으로 세는 가짜 측정기입니다. 결정적이라 테스트에 적합합니다. */
const services: LayoutServices = {
  measureText: (text) => text.length * 10,
  hasLogo: () => false,
};

describe('ellipsize', () => {
  it('폭이 남으면 그대로 둡니다', () => {
    expect(ellipsize('abc', 100, STYLE, services)).toBe('abc');
  });

  it('딱 맞으면 그대로 둡니다', () => {
    expect(ellipsize('abc', 30, STYLE, services)).toBe('abc');
  });

  it('넘치면 말줄임표를 붙입니다', () => {
    // 말줄임표가 폭 10을 먹으므로 40 안에는 글자 3개가 들어갑니다.
    expect(ellipsize('abcdef', 40, STYLE, services)).toBe('abc…');
  });

  it('말줄임표조차 못 넣을 폭이면 빈 문자열입니다', () => {
    expect(ellipsize('abcdef', 5, STYLE, services)).toBe('');
  });

  it('빈 문자열은 빈 문자열입니다', () => {
    expect(ellipsize('', 100, STYLE, services)).toBe('');
  });

  it('폭이 0 이하면 빈 문자열입니다', () => {
    expect(ellipsize('abc', 0, STYLE, services)).toBe('');
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/layout/primitives.test.ts
```

기대 결과: `Failed to resolve import "./primitives"`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/primitives.ts`:

```ts
import type { LayoutServices, TextStyle } from './types';

const ELLIPSIS = '…';

export function ellipsize(
  text: string,
  maxWidth: number,
  style: TextStyle,
  services: LayoutServices,
): string {
  if (text === '' || maxWidth <= 0) return '';
  if (services.measureText(text, style) <= maxWidth) return text;

  const ellipsisWidth = services.measureText(ELLIPSIS, style);
  if (ellipsisWidth > maxWidth) return '';

  const budget = maxWidth - ellipsisWidth;
  const chars = [...text];
  let kept = '';

  for (const char of chars) {
    const candidate = kept + char;
    if (services.measureText(candidate, style) > budget) break;
    kept = candidate;
  }

  return kept === '' ? '' : kept + ELLIPSIS;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/layout/primitives.test.ts
```

기대 결과: `6 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/primitives.ts src/core/layout/primitives.test.ts
git commit -m "말줄임 원시 함수 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 10: 하단 정보 바 프리셋

**Files:**
- Create: `src/core/layout/presets/infoBar.ts`
- Test: `src/core/layout/presets/infoBar.test.ts`

**Interfaces:**
- Consumes: `types.ts`, `options.ts`, `template.ts`, `primitives.ts`
- Produces: `const INFO_BAR_OPTIONS: PresetOption[]`, `const infoBarLayout: PresetLayout`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/layout/presets/infoBar.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { INFO_BAR_OPTIONS, infoBarLayout } from './infoBar';
import { defaultValues } from '../options';
import type { LayoutInput, LayoutServices, SceneNode } from '../types';

const services: LayoutServices = {
  measureText: (text, style) => text.length * style.size * 0.5,
  hasLogo: () => false,
};

function input(overrides: Partial<LayoutInput> = {}): LayoutInput {
  return {
    photo: { width: 1500, height: 1000 },
    fields: { MAKER: 'Nikon', BODY: 'Z 6II', MM: '35mm', F: 'f/1.8', SEC: '1/250s', ISO: 'ISO 400' },
    logoId: undefined,
    options: defaultValues(INFO_BAR_OPTIONS),
    ...overrides,
  };
}

function texts(nodes: SceneNode[]): string[] {
  return nodes.filter((n) => n.kind === 'text').map((n) => n.text);
}

describe('infoBarLayout', () => {
  it('사진 아래에 바 높이만큼 캔버스를 늘립니다', () => {
    const scene = infoBarLayout(input(), services);
    expect(scene.width).toBe(1500);
    expect(scene.height).toBe(1000 + 120);
  });

  it('사진을 원점에 원본 크기로 놓습니다', () => {
    const scene = infoBarLayout(input(), services);
    const image = scene.nodes.find((n) => n.kind === 'image');
    expect(image).toEqual({ kind: 'image', x: 0, y: 0, w: 1500, h: 1000 });
  });

  it('좌우 두 줄의 텍스트를 만듭니다', () => {
    const scene = infoBarLayout(input(), services);
    expect(texts(scene.nodes)).toEqual(['Nikon · Z 6II', '35mm · f/1.8 · 1/250s · ISO 400']);
  });

  it('값이 없으면 그 텍스트 노드를 아예 만들지 않습니다', () => {
    const scene = infoBarLayout(input({ fields: { MAKER: 'Nikon', BODY: 'Z 6II' } }), services);
    expect(texts(scene.nodes)).toEqual(['Nikon · Z 6II']);
  });

  it('배경색 옵션이 Scene 배경에 반영됩니다', () => {
    const options = defaultValues(INFO_BAR_OPTIONS);
    options.set('BACKGROUND', '#000000');
    const scene = infoBarLayout(input({ options }), services);
    expect(scene.background).toBe('#000000');
  });

  it('바 높이 옵션이 캔버스 높이에 반영됩니다', () => {
    const options = defaultValues(INFO_BAR_OPTIONS);
    options.set('BAR_HEIGHT', 300);
    const scene = infoBarLayout(input({ options }), services);
    expect(scene.height).toBe(1300);
  });

  it('로고가 있으면 logo 노드를 만듭니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const scene = infoBarLayout(input({ logoId: 'nikon' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    expect(logo).toMatchObject({ kind: 'logo', logoId: 'nikon' });
  });

  it('로고가 없으면 logo 노드를 만들지 않습니다', () => {
    const scene = infoBarLayout(input({ logoId: 'nikon' }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
  });

  it('사진 크기가 달라도 같은 옵션이면 바 높이 비율이 같습니다', () => {
    const wide = infoBarLayout(input({ photo: { width: 3000, height: 1000 } }), services);
    const square = infoBarLayout(input({ photo: { width: 1000, height: 1000 } }), services);
    expect(wide.height - 1000).toBe(square.height - 1000);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/layout/presets/infoBar.test.ts
```

기대 결과: `Failed to resolve import "./infoBar"`.

- [ ] **Step 3: 구현 작성**

`src/core/layout/presets/infoBar.ts`:

```ts
import { num, str, type PresetOption } from '../options';
import { ellipsize } from '../primitives';
import { renderTemplate } from '../template';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const INFO_BAR_OPTIONS: PresetOption[] = [
  { id: 'BACKGROUND', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', type: 'color', default: '#111111' },
  { id: 'BAR_HEIGHT', type: 'number', default: 120, unit: 'u' },
  { id: 'SIDE_PADDING', type: 'number', default: 60, unit: 'u' },
  { id: 'FONT_SIZE', type: 'number', default: 34, unit: 'u' },
  { id: 'FONT_WEIGHT', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'DIVIDER', type: 'text', default: '·' },
  { id: 'PRIMARY_TEMPLATE', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'SECONDARY_TEMPLATE', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
];

export const infoBarLayout: PresetLayout = (input, services) => {
  const options = input.options;
  const barHeight = num(options, 'BAR_HEIGHT');
  const padding = num(options, 'SIDE_PADDING');
  const fontSize = num(options, 'FONT_SIZE');
  const textColor = str(options, 'TEXT_COLOR');
  const divider = str(options, 'DIVIDER');

  const baseStyle: Omit<TextStyle, 'align'> = {
    family: 'Inter, system-ui, sans-serif',
    size: fontSize,
    weight: num(options, 'FONT_WEIGHT'),
    style: 'normal',
    color: textColor,
    baseline: 'middle',
    alpha: 1,
  };

  const photoWidth = input.photo.width;
  const photoHeight = input.photo.height;
  const barCenterY = photoHeight + barHeight / 2;
  const nodes: SceneNode[] = [
    { kind: 'image', x: 0, y: 0, w: photoWidth, h: photoHeight },
  ];

  const showLogo = input.logoId !== undefined && services.hasLogo(input.logoId);
  const logoWidth = barHeight * 0.6;
  const logoGap = showLogo ? logoWidth + padding * 0.4 : 0;

  if (showLogo && input.logoId !== undefined) {
    const logoHeight = barHeight * 0.4;
    nodes.push({
      kind: 'logo',
      x: padding,
      y: barCenterY - logoHeight / 2,
      w: logoWidth,
      h: logoHeight,
      logoId: input.logoId,
      fill: textColor,
    });
  }

  // 좌우 텍스트가 만나지 않도록 각자 절반보다 조금 좁은 폭을 갖습니다.
  const available = photoWidth - padding * 2 - logoGap;
  const half = available / 2 - padding * 0.25;

  const leftStyle: TextStyle = { ...baseStyle, align: 'left' };
  const left = ellipsize(
    renderTemplate(str(options, 'PRIMARY_TEMPLATE'), input.fields, divider),
    half,
    leftStyle,
    services,
  );
  if (left) {
    nodes.push({ kind: 'text', x: padding + logoGap, y: barCenterY, text: left, style: leftStyle });
  }

  const rightStyle: TextStyle = { ...baseStyle, align: 'right' };
  const right = ellipsize(
    renderTemplate(str(options, 'SECONDARY_TEMPLATE'), input.fields, divider),
    half,
    rightStyle,
    services,
  );
  if (right) {
    nodes.push({ kind: 'text', x: photoWidth - padding, y: barCenterY, text: right, style: rightStyle });
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

```bash
npm test -- src/core/layout/presets/infoBar.test.ts
```

기대 결과: `9 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/layout/presets/infoBar.ts src/core/layout/presets/infoBar.test.ts
git commit -m "하단 정보 바 프리셋 레이아웃 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 11: paint와 배율 불변성 테스트

이 계획에서 가장 중요한 작업입니다. 미리보기와 내보내기가 어긋나지 않는다는 보장이 여기서 나옵니다.

`paint`는 `pxPerUnit`을 맨 앞의 `ctx.scale` 한 번에만 씁니다. 그 뒤 모든 좌표와 글자 크기는 디자인 단위 그대로 넘깁니다. 이 성질을 지키면 배율이 달라도 캔버스에 내려가는 명령이 `scale` 하나만 빼고 완전히 같습니다. 테스트가 검사할 것이 바로 이 명령 목록의 동일성입니다. 픽셀을 비교하는 것보다 정확하고, 브라우저 없이 돌아갑니다.

**Files:**
- Create: `src/core/paint/paint.ts`
- Test: `src/core/paint/paint.test.ts`

**Interfaces:**
- Consumes: `src/core/layout/types.ts`의 `Scene`, `SceneNode`
- Produces: `interface PaintTarget`, `interface PaintSources`, `function paint(scene: Scene, ctx: PaintTarget, pxPerUnit: number, sources: PaintSources): void`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/paint/paint.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { paint, type PaintSources, type PaintTarget } from './paint';
import type { Scene } from '../layout/types';

/** 캔버스에 내려가는 명령을 순서대로 기록합니다. */
function recorder(): { ctx: PaintTarget; calls: string[] } {
  const calls: string[] = [];
  const log = (name: string, ...args: unknown[]) => calls.push(`${name}(${args.join(',')})`);
  const ctx = {
    save: () => log('save'),
    restore: () => log('restore'),
    scale: (x: number, y: number) => log('scale', x, y),
    translate: (x: number, y: number) => log('translate', x, y),
    fillRect: (x: number, y: number, w: number, h: number) => log('fillRect', x, y, w, h),
    fillText: (t: string, x: number, y: number) => log('fillText', t, x, y),
    drawImage: (_: unknown, x: number, y: number, w: number, h: number) => log('drawImage', x, y, w, h),
    fill: (path: unknown) => log('fill', String(path)),
    set fillStyle(value: string) {
      log('set fillStyle', value);
    },
    set font(value: string) {
      log('set font', value);
    },
    set textAlign(value: string) {
      log('set textAlign', value);
    },
    set textBaseline(value: string) {
      log('set textBaseline', value);
    },
    set globalAlpha(value: number) {
      log('set globalAlpha', value);
    },
  } as unknown as PaintTarget;
  return { ctx, calls };
}

const sources: PaintSources = {
  photo: {} as CanvasImageSource,
  logo: (id) => (id === 'nikon' ? (`path:${id}` as unknown as Path2D) : null),
};

const SCENE: Scene = {
  width: 1500,
  height: 1120,
  background: '#ffffff',
  nodes: [
    { kind: 'image', x: 0, y: 0, w: 1500, h: 1000 },
    { kind: 'rect', x: 0, y: 1000, w: 1500, h: 2, fill: '#dddddd', alpha: 0.5 },
    { kind: 'logo', x: 60, y: 1036, w: 72, h: 48, logoId: 'nikon', fill: '#111111' },
    {
      kind: 'text',
      x: 200,
      y: 1060,
      text: 'Nikon · Z 6II',
      style: {
        family: 'Inter',
        size: 34,
        weight: 400,
        style: 'normal',
        color: '#111111',
        align: 'left',
        baseline: 'middle',
        alpha: 1,
      },
    },
  ],
};

describe('paint', () => {
  it('배율만 다르면 scale 호출 하나를 빼고 명령이 완전히 같습니다', () => {
    const a = recorder();
    const b = recorder();
    paint(SCENE, a.ctx, 1, sources);
    paint(SCENE, b.ctx, 0.25, sources);

    const strip = (calls: string[]) => calls.filter((c) => !c.startsWith('scale('));
    expect(strip(a.calls)).toEqual(strip(b.calls));
    expect(a.calls).toContain('scale(1,1)');
    expect(b.calls).toContain('scale(0.25,0.25)');
  });

  it('배경을 먼저 칠합니다', () => {
    const { ctx, calls } = recorder();
    paint(SCENE, ctx, 1, sources);
    expect(calls[0]).toBe('save');
    expect(calls[1]).toBe('scale(1,1)');
    expect(calls[2]).toBe('set fillStyle(#ffffff)');
    expect(calls[3]).toBe('fillRect(0,0,1500,1120)');
  });

  it('마지막에 상태를 되돌립니다', () => {
    const { ctx, calls } = recorder();
    paint(SCENE, ctx, 1, sources);
    expect(calls.at(-1)).toBe('restore');
  });

  it('글꼴 크기를 디자인 단위 그대로 넘깁니다', () => {
    const { ctx, calls } = recorder();
    paint(SCENE, ctx, 0.25, sources);
    expect(calls).toContain('set font(normal 400 34px Inter)');
  });

  it('로고가 없으면 fill을 부르지 않습니다', () => {
    const { ctx, calls } = recorder();
    const noLogo: PaintSources = { ...sources, logo: () => null };
    paint(SCENE, ctx, 1, noLogo);
    expect(calls.some((c) => c.startsWith('fill(path'))).toBe(false);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/paint/paint.test.ts
```

기대 결과: `Failed to resolve import "./paint"`.

- [ ] **Step 3: 구현 작성**

`src/core/paint/paint.ts`:

```ts
import type { Scene, SceneNode } from '../layout/types';

/** 브라우저와 워커의 2D 컨텍스트가 모두 이 모양을 만족합니다. */
export type PaintTarget = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface PaintSources {
  photo: CanvasImageSource;
  /** 0..1 정규화된 박스에 맞춰 둔 경로입니다. 없으면 null입니다. */
  logo(logoId: string): Path2D | null;
}

function paintNode(node: SceneNode, ctx: PaintTarget, sources: PaintSources): void {
  switch (node.kind) {
    case 'image':
      ctx.drawImage(sources.photo, node.x, node.y, node.w, node.h);
      return;

    case 'rect':
      ctx.globalAlpha = node.alpha;
      ctx.fillStyle = node.fill;
      ctx.fillRect(node.x, node.y, node.w, node.h);
      ctx.globalAlpha = 1;
      return;

    case 'text':
      ctx.globalAlpha = node.style.alpha;
      ctx.fillStyle = node.style.color;
      ctx.font = `${node.style.style} ${node.style.weight} ${node.style.size}px ${node.style.family}`;
      ctx.textAlign = node.style.align;
      ctx.textBaseline = node.style.baseline;
      ctx.fillText(node.text, node.x, node.y);
      ctx.globalAlpha = 1;
      return;

    case 'logo': {
      const path = sources.logo(node.logoId);
      if (!path) return;
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.scale(node.w, node.h);
      ctx.fillStyle = node.fill;
      ctx.fill(path);
      ctx.restore();
      return;
    }
  }
}

/**
 * pxPerUnit은 맨 앞의 scale 한 번에만 씁니다. 그 뒤로는 디자인 단위를 그대로 넘깁니다.
 * 이 규칙 덕분에 미리보기와 내보내기가 같은 명령을 내리고, 두 결과가 어긋날 수 없습니다.
 * 이 함수 안에서 pxPerUnit을 다시 곱하는 순간 그 보장이 깨집니다.
 */
export function paint(scene: Scene, ctx: PaintTarget, pxPerUnit: number, sources: PaintSources): void {
  ctx.save();
  ctx.scale(pxPerUnit, pxPerUnit);
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);
  for (const node of scene.nodes) paintNode(node, ctx, sources);
  ctx.restore();
}
```

`logo` 분기 안의 `ctx.scale`은 배율 불변성을 깨지 않습니다. 인자가 `pxPerUnit`이 아니라 노드에 적힌 디자인 단위 크기이기 때문입니다. 테스트에서 `scale(` 로 시작하는 명령을 걸러 낼 때 이 호출도 함께 빠지지만, 두 배율에서 같은 값이라 비교 결과에 영향을 주지 않습니다.

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/paint/paint.test.ts
```

기대 결과: `5 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/paint/paint.ts src/core/paint/paint.test.ts
git commit -m "Scene 페인팅과 배율 불변성 테스트 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 12: 내보내기 크기 계산

**Files:**
- Create: `src/core/export/resolution.ts`, `src/core/limits/clampExportSize.ts`
- Test: `src/core/limits/clampExportSize.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `type ExportPreset = 'original' | '4k' | '2k' | 'sns'`, `const EXPORT_LONG_EDGE: Record<Exclude<ExportPreset, 'original'>, number>`, `interface CanvasLimit { maxSide: number; maxArea: number }`, `interface ExportSize { width: number; height: number; clamped: boolean }`, `function clampExportSize(sceneWidth, sceneHeight, targetLongEdge, limit): ExportSize`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/limits/clampExportSize.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { clampExportSize, type CanvasLimit } from './clampExportSize';

const ROOMY: CanvasLimit = { maxSide: 32_767, maxArea: 268_435_456 };

describe('clampExportSize', () => {
  it('긴 변을 목표에 맞추고 비율을 지킵니다', () => {
    const size = clampExportSize(1500, 1120, 3840, ROOMY);
    expect(size.width).toBe(3840);
    expect(size.height).toBe(2867);
    expect(size.clamped).toBe(false);
  });

  it('세로 사진은 세로가 긴 변입니다', () => {
    const size = clampExportSize(1000, 1620, 1920, ROOMY);
    expect(size.height).toBe(1920);
    expect(size.width).toBe(1185);
  });

  it('최대 변 길이를 넘으면 줄이고 표시합니다', () => {
    const tight: CanvasLimit = { maxSide: 4096, maxArea: 268_435_456 };
    const size = clampExportSize(1500, 1000, 8000, tight);
    expect(size.width).toBe(4096);
    expect(size.clamped).toBe(true);
  });

  it('최대 면적을 넘으면 줄이고 표시합니다', () => {
    const tight: CanvasLimit = { maxSide: 32_767, maxArea: 16_777_216 };
    const size = clampExportSize(1500, 1000, 8000, tight);
    expect(size.width * size.height).toBeLessThanOrEqual(16_777_216);
    expect(size.clamped).toBe(true);
  });

  it('한계 안에 들어오면 clamped가 false입니다', () => {
    expect(clampExportSize(1500, 1000, 1920, ROOMY).clamped).toBe(false);
  });

  it('최소 1픽셀은 보장합니다', () => {
    const size = clampExportSize(1500, 1, 10, ROOMY);
    expect(size.height).toBeGreaterThanOrEqual(1);
  });

  it('4면 여백처럼 캔버스가 커지는 경우도 같은 규칙을 씁니다', () => {
    const tight: CanvasLimit = { maxSide: 32_767, maxArea: 16_777_216 };
    const size = clampExportSize(1200, 1500, 6000, tight);
    expect(size.width * size.height).toBeLessThanOrEqual(16_777_216);
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/limits/clampExportSize.test.ts
```

기대 결과: `Failed to resolve import "./clampExportSize"`.

- [ ] **Step 3: 구현 작성**

`src/core/export/resolution.ts`:

```ts
export type ExportPreset = 'original' | '4k' | '2k' | 'sns';

export const EXPORT_LONG_EDGE: Record<Exclude<ExportPreset, 'original'>, number> = {
  '4k': 3840,
  '2k': 1920,
  sns: 1080,
};

/**
 * 미리보기 캔버스의 긴 변입니다. 옵션을 만질 때마다 다시 그리는 경로이므로
 * 화면에서 판단이 가능한 선에서 가장 작게 잡습니다.
 */
export const PREVIEW_LONG_EDGE = 1600;

/**
 * 'original'은 사진의 원래 픽셀 크기를 기준으로 삼습니다. 프레임이 붙으면
 * 캔버스는 그보다 커지므로, 최종 크기는 clampExportSize가 다시 정합니다.
 */
export function targetLongEdge(preset: ExportPreset, photoLongEdgePx: number): number {
  return preset === 'original' ? photoLongEdgePx : EXPORT_LONG_EDGE[preset];
}
```

`src/core/limits/clampExportSize.ts`:

```ts
export interface CanvasLimit {
  /** 한 변의 최대 픽셀 수입니다. */
  maxSide: number;
  /** 가로 곱하기 세로의 최대 픽셀 수입니다. */
  maxArea: number;
}

export interface ExportSize {
  width: number;
  height: number;
  /** 기기 한계 때문에 요청보다 작아졌으면 true입니다. 화면에 알려야 합니다. */
  clamped: boolean;
}

export function clampExportSize(
  sceneWidth: number,
  sceneHeight: number,
  targetLongEdge: number,
  limit: CanvasLimit,
): ExportSize {
  const sceneLongEdge = Math.max(sceneWidth, sceneHeight);
  const requested = targetLongEdge / sceneLongEdge;

  let scale = requested;
  scale = Math.min(scale, limit.maxSide / sceneLongEdge);
  const areaScale = Math.sqrt(limit.maxArea / (sceneWidth * sceneHeight));
  scale = Math.min(scale, areaScale);

  const width = Math.max(1, Math.floor(sceneWidth * scale));
  const height = Math.max(1, Math.floor(sceneHeight * scale));

  return { width, height, clamped: scale < requested };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/limits/clampExportSize.test.ts
```

기대 결과: `7 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/export/resolution.ts src/core/limits/clampExportSize.ts src/core/limits/clampExportSize.test.ts
git commit -m "내보내기 크기 계산과 캔버스 한계 적용 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 13: EXIF 읽기와 표시 문자열 변환

이 계획에서는 브랜드 정규화를 하지 않습니다. `Make`와 `Model`을 다듬지 않고 그대로 씁니다. 정규화는 다음 계획에서 붙입니다.

**Files:**
- Create: `src/core/exif/read.ts`, `src/core/exif/map.ts`, `src/core/exif/format.ts`
- Test: `src/core/exif/format.test.ts`

**Interfaces:**
- Consumes: `exifreader`, `src/core/layout/types.ts`의 `TemplateToken`
- Produces: `interface PhotoMeta`, `function readExif(buffer: ArrayBuffer): Promise<PhotoMeta>`, `function toFields(meta: PhotoMeta): Partial<Record<TemplateToken, string>>`, `function formatShutter`, `function formatAperture`, `function formatFocalLength`, `function formatIso`, `function formatTakenAt`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/exif/format.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  formatAperture,
  formatFocalLength,
  formatIso,
  formatShutter,
  formatTakenAt,
} from './format';

describe('formatShutter', () => {
  it('1초 미만은 분수로 씁니다', () => {
    expect(formatShutter(1 / 250)).toBe('1/250s');
    expect(formatShutter(0.004)).toBe('1/250s');
  });

  it('1초 이상은 초로 씁니다', () => {
    expect(formatShutter(1)).toBe('1s');
    expect(formatShutter(2.5)).toBe('2.5s');
    expect(formatShutter(30)).toBe('30s');
  });

  it('값이 없으면 undefined입니다', () => {
    expect(formatShutter(undefined)).toBeUndefined();
    expect(formatShutter(0)).toBeUndefined();
    expect(formatShutter(Number.NaN)).toBeUndefined();
  });
});

describe('formatAperture', () => {
  it('f 표기로 씁니다', () => {
    expect(formatAperture(1.8)).toBe('f/1.8');
    expect(formatAperture(8)).toBe('f/8');
    expect(formatAperture(5.6)).toBe('f/5.6');
  });

  it('값이 없으면 undefined입니다', () => {
    expect(formatAperture(undefined)).toBeUndefined();
    expect(formatAperture(0)).toBeUndefined();
  });
});

describe('formatFocalLength', () => {
  it('반올림해서 mm를 붙입니다', () => {
    expect(formatFocalLength(35, undefined)).toBe('35mm');
    expect(formatFocalLength(6.765, undefined)).toBe('7mm');
  });

  it('환산값이 다르면 괄호로 병기합니다', () => {
    expect(formatFocalLength(35, 52)).toBe('35mm (52mm)');
  });

  it('환산값이 같으면 병기하지 않습니다', () => {
    expect(formatFocalLength(35, 35)).toBe('35mm');
  });

  it('실초점거리가 없으면 환산값만 씁니다', () => {
    expect(formatFocalLength(undefined, 52)).toBe('52mm');
  });

  it('둘 다 없으면 undefined입니다', () => {
    expect(formatFocalLength(undefined, undefined)).toBeUndefined();
  });
});

describe('formatIso', () => {
  it('ISO 접두사를 붙입니다', () => {
    expect(formatIso(400)).toBe('ISO 400');
  });

  it('값이 없으면 undefined입니다', () => {
    expect(formatIso(undefined)).toBeUndefined();
    expect(formatIso(0)).toBeUndefined();
  });
});

describe('formatTakenAt', () => {
  it('EXIF 날짜 형식을 하이픈 형식으로 바꿉니다', () => {
    expect(formatTakenAt('2026:09:09 14:03:21')).toBe('2026-09-09');
  });

  it('형식이 다르면 undefined입니다', () => {
    expect(formatTakenAt('nope')).toBeUndefined();
    expect(formatTakenAt(undefined)).toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/exif/format.test.ts
```

기대 결과: `Failed to resolve import "./format"`.

- [ ] **Step 3: format.ts 작성**

`src/core/exif/format.ts`:

```ts
function ok(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function formatShutter(seconds: number | undefined): string | undefined {
  if (!ok(seconds)) return undefined;
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

export function formatAperture(fNumber: number | undefined): string | undefined {
  if (!ok(fNumber)) return undefined;
  return `f/${Number(fNumber.toFixed(1))}`;
}

export function formatFocalLength(
  actual: number | undefined,
  equivalent: number | undefined,
): string | undefined {
  const a = ok(actual) ? Math.round(actual) : undefined;
  const e = ok(equivalent) ? Math.round(equivalent) : undefined;
  if (a === undefined && e === undefined) return undefined;
  if (a === undefined) return `${e}mm`;
  if (e === undefined || e === a) return `${a}mm`;
  return `${a}mm (${e}mm)`;
}

export function formatIso(iso: number | undefined): string | undefined {
  if (!ok(iso)) return undefined;
  return `ISO ${iso}`;
}

/** EXIF는 `2026:09:09 14:03:21` 형식으로 씁니다. */
export function formatTakenAt(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = /^(\d{4}):(\d{2}):(\d{2})\s/.exec(raw);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}-${match[3]}`;
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/exif/format.test.ts
```

기대 결과: `16 passed`.

- [ ] **Step 5: read.ts와 map.ts 작성**

`src/core/exif/read.ts`:

```ts
import ExifReader from 'exifreader';

export interface PhotoMeta {
  make: string | undefined;
  model: string | undefined;
  lensModel: string | undefined;
  focalLength: number | undefined;
  focalLengthIn35mm: number | undefined;
  fNumber: number | undefined;
  iso: number | undefined;
  exposureTime: number | undefined;
  orientation: number;
  takenAtRaw: string | undefined;
  /** 원본 픽셀 크기입니다. 미리보기를 어느 축으로 줄일지 정하는 데 씁니다. */
  pixelWidth: number | undefined;
  pixelHeight: number | undefined;
}

function text(tag: { description?: unknown } | undefined): string | undefined {
  const value = tag?.description;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function number(tag: { value?: unknown } | undefined): number | undefined {
  const value = tag?.value;
  if (typeof value === 'number') return value;
  // exifreader는 유리수를 [분자, 분모]로 돌려주기도 합니다.
  if (Array.isArray(value) && value.length === 2) {
    const [n, d] = value;
    if (typeof n === 'number' && typeof d === 'number' && d !== 0) return n / d;
  }
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0];
  return undefined;
}

/**
 * EXIF는 항상 원본 파일에서 읽습니다. 디코딩 결과물에서 읽으면 안 됩니다.
 * HEIC를 JPEG로 바꾼 뒤 읽으면 메타데이터가 이미 사라졌거나 달라져 있습니다.
 */
export async function readExif(buffer: ArrayBuffer): Promise<PhotoMeta> {
  const tags = await ExifReader.load(buffer, { expanded: false, async: true });
  return {
    make: text(tags.Make),
    model: text(tags.Model),
    lensModel: text(tags.LensModel),
    focalLength: number(tags.FocalLength),
    focalLengthIn35mm: number(tags.FocalLengthIn35mmFilm),
    fNumber: number(tags.FNumber),
    iso: number(tags.ISOSpeedRatings),
    exposureTime: number(tags.ExposureTime),
    orientation: number(tags.Orientation) ?? 1,
    takenAtRaw: text(tags.DateTimeOriginal),
    pixelWidth: number(tags.PixelXDimension) ?? number(tags.ImageWidth),
    pixelHeight: number(tags.PixelYDimension) ?? number(tags.ImageLength),
  };
}
```

`src/core/exif/map.ts`:

```ts
import type { TemplateToken } from '../layout/types';
import {
  formatAperture,
  formatFocalLength,
  formatIso,
  formatShutter,
  formatTakenAt,
} from './format';
import type { PhotoMeta } from './read';

/** 값이 없는 항목은 키 자체를 넣지 않습니다. 템플릿이 그 조각을 통째로 버립니다. */
export function toFields(meta: PhotoMeta): Partial<Record<TemplateToken, string>> {
  const fields: Partial<Record<TemplateToken, string>> = {};
  const put = (token: TemplateToken, value: string | undefined) => {
    if (value !== undefined) fields[token] = value;
  };

  put('MAKER', meta.make);
  put('BODY', meta.model);
  put('LENS', meta.lensModel);
  put('MM', formatFocalLength(meta.focalLength, meta.focalLengthIn35mm));
  put('F', formatAperture(meta.fNumber));
  put('SEC', formatShutter(meta.exposureTime));
  put('ISO', formatIso(meta.iso));
  put('TAKEN_AT', formatTakenAt(meta.takenAtRaw));

  return fields;
}
```

- [ ] **Step 6: 타입 검사와 전체 테스트 실행**

```bash
npx tsc -b && npm test
```

기대 결과: 타입 오류 없음, 모든 테스트 통과.

- [ ] **Step 7: 커밋**

```bash
git add src/core/exif
git commit -m "EXIF 읽기와 표시 문자열 변환 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 14: 미리보기 축소 힌트

미리보기를 위해 원본을 통째로 디코딩하면 4500만 화소 사진에서 첫 화면이 몇 초씩 늦습니다. `createImageBitmap`에 축소를 맡기면 디코딩 자체가 작은 크기로 끝납니다. 어느 축을 지정할지는 EXIF에 적힌 원본 크기로 정합니다.

**Files:**
- Create: `src/core/io/decode/resizeHint.ts`
- Test: `src/core/io/decode/resizeHint.test.ts`

**Interfaces:**
- Consumes: 없음
- Produces: `interface ResizeHint { resizeWidth?: number; resizeHeight?: number; resizeQuality?: 'high' }`, `function resizeHint(maxLongEdge: number | undefined, source: { width: number; height: number } | undefined): ResizeHint`

- [ ] **Step 1: 실패하는 테스트 작성**

`src/core/io/decode/resizeHint.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { resizeHint } from './resizeHint';

describe('resizeHint', () => {
  it('상한이 없으면 축소하지 않습니다', () => {
    expect(resizeHint(undefined, { width: 6000, height: 4000 })).toEqual({});
  });

  it('가로 사진은 가로를 상한에 맞춥니다', () => {
    expect(resizeHint(1600, { width: 6000, height: 4000 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('세로 사진은 세로를 상한에 맞춥니다', () => {
    expect(resizeHint(1600, { width: 4000, height: 6000 })).toEqual({
      resizeHeight: 1600,
      resizeQuality: 'high',
    });
  });

  it('이미 상한보다 작으면 축소하지 않습니다', () => {
    expect(resizeHint(1600, { width: 1200, height: 800 })).toEqual({});
  });

  it('정사각형은 가로를 기준으로 잡습니다', () => {
    expect(resizeHint(1600, { width: 3000, height: 3000 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('원본 크기를 모르면 가로를 기준으로 잡습니다', () => {
    expect(resizeHint(1600, undefined)).toEqual({ resizeWidth: 1600, resizeQuality: 'high' });
  });

  it('원본 크기가 0이면 모르는 것으로 봅니다', () => {
    expect(resizeHint(1600, { width: 0, height: 0 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

```bash
npm test -- src/core/io/decode/resizeHint.test.ts
```

기대 결과: `Failed to resolve import "./resizeHint"`.

- [ ] **Step 3: 구현 작성**

`src/core/io/decode/resizeHint.ts`:

```ts
export interface ResizeHint {
  resizeWidth?: number;
  resizeHeight?: number;
  resizeQuality?: 'high';
}

/**
 * 원본 크기를 모르면 가로를 기준으로 잡습니다. 세로 사진이면 미리보기가 상한보다
 * 조금 커지지만, 원본을 통째로 디코딩하는 것보다는 훨씬 쌉니다.
 */
export function resizeHint(
  maxLongEdge: number | undefined,
  source: { width: number; height: number } | undefined,
): ResizeHint {
  if (maxLongEdge === undefined) return {};

  if (!source || source.width <= 0 || source.height <= 0) {
    return { resizeWidth: maxLongEdge, resizeQuality: 'high' };
  }

  if (Math.max(source.width, source.height) <= maxLongEdge) return {};

  return source.width >= source.height
    ? { resizeWidth: maxLongEdge, resizeQuality: 'high' }
    : { resizeHeight: maxLongEdge, resizeQuality: 'high' };
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
npm test -- src/core/io/decode/resizeHint.test.ts
```

기대 결과: `7 passed`.

- [ ] **Step 5: 커밋**

```bash
git add src/core/io/decode/resizeHint.ts src/core/io/decode/resizeHint.test.ts
git commit -m "미리보기 축소 힌트 계산 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 15: 브라우저 어댑터

`src/core/` 규칙상 DOM을 직접 만지는 코드는 주입받는 형태여야 합니다. 실제 브라우저 구현을 여기 모읍니다. 이 파일들은 브라우저에서만 돌아가므로 Task 17의 수동 확인으로 검증합니다.

**Files:**
- Create: `src/core/paint/measure.ts`, `src/core/limits/probeCanvasLimit.ts`, `src/core/export/webpSupport.ts`, `src/core/export/encode.ts`, `src/core/io/decode/raster.ts`, `src/core/io/decode/index.ts`

**Interfaces:**
- Consumes: `sniff.ts`, `orientation.ts`, `resizeHint.ts`, `clampExportSize.ts`의 `CanvasLimit`, `layout/types.ts`의 `TextStyle`
- Produces: `function createMeasurer(): (text: string, style: TextStyle) => number`, `function probeCanvasLimit(): CanvasLimit`, `function canvasSupportsWebp(): Promise<boolean>`, `type ExportFormat`, `function encodeCanvas(canvas, format, quality): Promise<Blob>`, `interface DecodedImage { bitmap: ImageBitmap; width: number; height: number }`, `interface DecodeRequest`, `function decodeImage(request: DecodeRequest): Promise<DecodedImage>`, `function detectKind(file: Blob): Promise<FileKind>`

- [ ] **Step 1: measure.ts 작성**

```ts
import type { TextStyle } from '../layout/types';

/**
 * 배율 1에서 재므로 반환값의 단위가 곧 디자인 단위입니다.
 * 캔버스 하나를 재사용해 매 호출마다 새로 만들지 않습니다.
 */
export function createMeasurer(): (text: string, style: TextStyle) => number {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D 컨텍스트를 만들지 못했습니다');

  return (text, style) => {
    ctx.font = `${style.style} ${style.weight} ${style.size}px ${style.family}`;
    return ctx.measureText(text).width;
  };
}
```

- [ ] **Step 2: probeCanvasLimit.ts 작성**

```ts
import type { CanvasLimit } from './clampExportSize';

const CACHE_KEY = 'halfstop.canvasLimit.v1';

/**
 * iOS Safari는 한계를 넘겨도 예외를 던지지 않고 투명한 캔버스를 돌려줍니다.
 * 그래서 크기만 확인해서는 안 되고, 픽셀을 그린 뒤 실제로 되읽어야 합니다.
 */
function canAllocate(side: number): boolean {
  const canvas = document.createElement('canvas');
  try {
    canvas.width = side;
    canvas.height = side;
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(side - 1, side - 1, 1, 1);
    const pixel = ctx.getImageData(side - 1, side - 1, 1, 1).data;
    return pixel[0] === 255 && pixel[3] === 255;
  } catch {
    return false;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}

export function probeCanvasLimit(): CanvasLimit {
  const cached = readCache();
  if (cached) return cached;

  let low = 1024;
  let high = 32_768;
  if (!canAllocate(low)) {
    const limit: CanvasLimit = { maxSide: 1024, maxArea: 1024 * 1024 };
    writeCache(limit);
    return limit;
  }

  while (high - low > 256) {
    const mid = Math.floor((low + high) / 2);
    if (canAllocate(mid)) low = mid;
    else high = mid;
  }

  const limit: CanvasLimit = { maxSide: low, maxArea: low * low };
  writeCache(limit);
  return limit;
}

function readCache(): CanvasLimit | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      typeof (parsed as CanvasLimit).maxSide === 'number' &&
      typeof (parsed as CanvasLimit).maxArea === 'number'
    ) {
      return parsed as CanvasLimit;
    }
    return null;
  } catch {
    return null;
  }
}

function writeCache(limit: CanvasLimit): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(limit));
  } catch {
    // 사생활 보호 모드에서는 저장이 막힙니다. 측정값은 그대로 쓰면 됩니다.
  }
}
```

이 측정은 큰 캔버스를 여러 번 할당하므로 시간이 걸립니다. 첫 파일을 받을 때가 아니라 앱을 띄울 때 미리 돌려 두고, 결과를 캐시해 다음 방문에서는 건너뜁니다.

- [ ] **Step 3: webpSupport.ts와 encode.ts 작성**

`webpSupport.ts`:

```ts
/**
 * 요청한 타입을 무시하고 PNG를 돌려주는 브라우저가 있습니다.
 * 그래서 성공 여부가 아니라 반환된 Blob의 타입을 봐야 합니다.
 */
export async function canvasSupportsWebp(): Promise<boolean> {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/webp', 0.9);
    });
    return blob?.type === 'image/webp';
  } catch {
    return false;
  }
}
```

`encode.ts`:

```ts
export type ExportFormat = 'image/jpeg' | 'image/png' | 'image/webp';

export async function encodeCanvas(
  canvas: HTMLCanvasElement,
  format: ExportFormat,
  quality: number,
): Promise<Blob> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, format, quality);
  });
  if (!blob) throw new Error(`${format} 인코딩에 실패했습니다`);
  return blob;
}
```

- [ ] **Step 4: 디코딩 경로 작성**

`src/core/io/decode/raster.ts`:

```ts
import { orientationTransform } from '../orientation';
import { resizeHint } from './resizeHint';

export interface DecodedImage {
  /** 이 시점에서 이미 똑바로 서 있습니다. 호출자는 회전을 다시 적용하지 않습니다. */
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export interface RasterRequest {
  file: Blob;
  autoOriented: boolean;
  orientation: number;
  /** 지정하면 긴 변이 이 값이 되도록 축소해 디코딩합니다. 미리보기용입니다. */
  maxLongEdge?: number;
  /** EXIF에 적힌 원본 크기입니다. 축소 축을 정하는 데만 씁니다. */
  sourceSize?: { width: number; height: number };
}

/**
 * 브라우저가 이미 회전을 적용했다면 그대로 씁니다. 아니라면 직접 돌립니다.
 * 회전을 두 번 적용하는 것이 이 경로에서 가장 흔한 실수입니다.
 */
export async function decodeRaster(request: RasterRequest): Promise<DecodedImage> {
  const hint = resizeHint(request.maxLongEdge, request.sourceSize);
  const bitmap = await createImageBitmap(request.file, hint);

  if (request.autoOriented || request.orientation === 1) {
    return { bitmap, width: bitmap.width, height: bitmap.height };
  }

  const oriented = orientationTransform(request.orientation, bitmap.width, bitmap.height);
  const canvas = new OffscreenCanvas(oriented.width, oriented.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('회전용 2D 컨텍스트를 만들지 못했습니다');
  ctx.setTransform(...oriented.matrix);
  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  const rotated = canvas.transferToImageBitmap();
  return { bitmap: rotated, width: rotated.width, height: rotated.height };
}
```

`src/core/io/decode/index.ts`:

```ts
import { sniff, SNIFF_BYTES, type FileKind } from '../sniff';
import { decodeRaster, type DecodedImage, type RasterRequest } from './raster';

export type { DecodedImage };
export type DecodeRequest = RasterRequest;

export async function detectKind(file: Blob): Promise<FileKind> {
  const head = new Uint8Array(await file.slice(0, SNIFF_BYTES).arrayBuffer());
  return sniff(head);
}

export async function decodeImage(request: DecodeRequest): Promise<DecodedImage> {
  const kind = await detectKind(request.file);
  switch (kind) {
    case 'jpeg':
    case 'png':
    case 'webp':
      return decodeRaster(request);
    case 'heic':
      throw new Error('HEIC는 다음 단계에서 지원합니다');
    case 'tiff':
    case 'cr3':
      throw new Error('RAW는 다음 단계에서 지원합니다');
    case 'unknown':
      throw new Error('지원하지 않는 파일 형식입니다');
  }
}
```

- [ ] **Step 5: 타입 검사**

```bash
npx tsc -b
```

기대 결과: 출력 없이 종료 코드 0.

- [ ] **Step 6: 커밋**

```bash
git add src/core/paint/measure.ts src/core/limits/probeCanvasLimit.ts src/core/export src/core/io/decode
git commit -m "브라우저 어댑터 계층 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 16: 미리보기와 내보내기 분리

미리보기는 자주 돌고 내보내기는 가끔 돕니다. 두 경로가 같은 `Scene`과 같은 `paint()`를 쓰되 비용만 다르게 갑니다. 미리보기 경로에는 인코딩도 objectURL 발급도 없습니다.

**Files:**
- Create: `src/core/render/buildScene.ts`, `src/core/render/paintToCanvas.ts`, `src/core/render/exportToBlob.ts`

**Interfaces:**
- Consumes: Task 5부터 15까지의 모든 모듈
- Produces: `interface SceneRequest`, `function buildScene(request: SceneRequest): Scene`, `interface PaintToCanvasRequest`, `function paintToCanvas(request: PaintToCanvasRequest): { width: number; height: number; clamped: boolean }`, `interface ExportRequest`, `interface ExportResult { blob: Blob; width: number; height: number; clamped: boolean }`, `function exportToBlob(request: ExportRequest): Promise<ExportResult>`

- [ ] **Step 1: buildScene.ts 작성**

```ts
import type { OptionValue } from '../layout/types';
import type { LayoutServices, PresetLayout, Scene, TemplateToken } from '../layout/types';
import { toUnits } from '../layout/units';

export interface SceneRequest {
  /** 미리보기 비트맵을 넘겨도 됩니다. 디자인 단위는 비율만 보므로 결과가 같습니다. */
  photoPx: { width: number; height: number };
  fields: Partial<Record<TemplateToken, string>>;
  logoId: string | undefined;
  layout: PresetLayout;
  options: ReadonlyMap<string, OptionValue>;
  services: LayoutServices;
}

export function buildScene(request: SceneRequest): Scene {
  const photo = toUnits(request.photoPx.width, request.photoPx.height);
  return request.layout(
    { photo, fields: request.fields, logoId: request.logoId, options: request.options },
    request.services,
  );
}
```

- [ ] **Step 2: paintToCanvas.ts 작성**

```ts
import { clampExportSize, type CanvasLimit } from '../limits/clampExportSize';
import type { Scene } from '../layout/types';
import { paint } from '../paint/paint';

export interface PaintToCanvasRequest {
  scene: Scene;
  canvas: HTMLCanvasElement;
  photo: CanvasImageSource;
  logo: (logoId: string) => Path2D | null;
  targetLongEdge: number;
  limit: CanvasLimit;
}

/**
 * 캔버스 크기를 정하고 Scene을 그립니다. 미리보기와 내보내기가 함께 씁니다.
 * 두 경로의 차이는 targetLongEdge와 넘기는 비트맵뿐입니다.
 */
export function paintToCanvas(request: PaintToCanvasRequest): {
  width: number;
  height: number;
  clamped: boolean;
} {
  const { scene, canvas } = request;
  const size = clampExportSize(scene.width, scene.height, request.targetLongEdge, request.limit);

  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D 컨텍스트를 만들지 못했습니다');

  ctx.imageSmoothingQuality = 'high';
  // Scene 전체의 긴 변을 기준으로 배율을 정해야 프레임까지 목표 크기 안에 들어옵니다.
  paint(scene, ctx, size.width / scene.width, { photo: request.photo, logo: request.logo });

  return size;
}
```

- [ ] **Step 3: exportToBlob.ts 작성**

```ts
import { encodeCanvas, type ExportFormat } from '../export/encode';
import { targetLongEdge, type ExportPreset } from '../export/resolution';
import type { CanvasLimit } from '../limits/clampExportSize';
import type { Scene } from '../layout/types';
import { paintToCanvas } from './paintToCanvas';

export interface ExportRequest {
  scene: Scene;
  /** 전체 해상도 비트맵입니다. 이 함수를 부르기 직전에 디코딩합니다. */
  photo: CanvasImageSource;
  photoLongEdgePx: number;
  logo: (logoId: string) => Path2D | null;
  limit: CanvasLimit;
  preset: ExportPreset;
  format: ExportFormat;
  quality: number;
}

export interface ExportResult {
  blob: Blob;
  width: number;
  height: number;
  /** 기기 한계로 요청보다 작아졌으면 true입니다. 화면에 알려야 합니다. */
  clamped: boolean;
}

export async function exportToBlob(request: ExportRequest): Promise<ExportResult> {
  const canvas = document.createElement('canvas');
  try {
    const size = paintToCanvas({
      scene: request.scene,
      canvas,
      photo: request.photo,
      logo: request.logo,
      targetLongEdge: targetLongEdge(request.preset, request.photoLongEdgePx),
      limit: request.limit,
    });
    const blob = await encodeCanvas(canvas, request.format, request.quality);
    return { blob, ...size };
  } finally {
    // 백킹 스토어를 즉시 반납합니다. 참조만 버리면 해제가 늦습니다.
    canvas.width = 0;
    canvas.height = 0;
  }
}
```

- [ ] **Step 4: 타입 검사와 전체 테스트**

```bash
npx tsc -b && npm test
```

기대 결과: 타입 오류 없음, 모든 테스트 통과.

- [ ] **Step 5: 커밋**

```bash
git add src/core/render
git commit -m "미리보기와 내보내기 렌더 경로 분리

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

### Task 17: 미리보기 UI와 엔드투엔드 확인

이 계획의 마지막 작업입니다. UI 문구는 한국어로 직접 적습니다. 영어 사전은 다음 계획에서 붙입니다.

**Files:**
- Modify: `src/ui/App.tsx`
- Create: `src/ui/usePipeline.ts`

**Interfaces:**
- Consumes: Task 16까지의 모든 모듈
- Produces: 동작하는 페이지

- [ ] **Step 1: 파이프라인 훅 작성**

`src/ui/usePipeline.ts`:

```ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { detectAutoOrientation } from '../core/io/autoOrientProbe';
import { decodeImage, type DecodedImage } from '../core/io/decode';
import { toFields } from '../core/exif/map';
import { readExif, type PhotoMeta } from '../core/exif/read';
import { PREVIEW_LONG_EDGE } from '../core/export/resolution';
import { defaultValues, type OptionValue } from '../core/layout/options';
import { INFO_BAR_OPTIONS, infoBarLayout } from '../core/layout/presets/infoBar';
import { swapsAxes } from '../core/io/orientation';
import type { CanvasLimit } from '../core/limits/clampExportSize';
import { probeCanvasLimit } from '../core/limits/probeCanvasLimit';
import { createMeasurer } from '../core/paint/measure';
import { buildScene } from '../core/render/buildScene';
import { exportToBlob } from '../core/render/exportToBlob';
import { paintToCanvas } from '../core/render/paintToCanvas';
import type { LayoutServices, TemplateToken } from '../core/layout/types';

const NO_LOGO = () => null;

/**
 * 탐지용 원본은 반드시 정사각형이 아니어야 합니다. 가로세로가 같으면 회전이
 * 일어났는지 관측할 방법이 없어 탐지가 늘 거짓을 돌려줍니다.
 * 바이트를 하드코딩하는 대신 캔버스로 만들어 실제로 유효한 JPEG임을 보장합니다.
 */
async function makeProbeJpeg(): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = 3;
  canvas.height = 2;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('탐지용 2D 컨텍스트를 만들지 못했습니다');
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 3, 2);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.9);
  });
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error('탐지용 JPEG 인코딩에 실패했습니다');
  return new Uint8Array(await blob.arrayBuffer());
}

/** 세션당 한 번이면 충분합니다. 결과 프라미스를 재사용합니다. */
let autoOrientedOnce: Promise<boolean> | null = null;
function autoOrientedFlag(): Promise<boolean> {
  autoOrientedOnce ??= makeProbeJpeg().then((base) =>
    detectAutoOrientation(async (blob) => createImageBitmap(blob), base),
  );
  return autoOrientedOnce;
}

interface Loaded {
  file: File;
  meta: PhotoMeta;
  fields: Partial<Record<TemplateToken, string>>;
  preview: DecodedImage;
}

export function usePipeline(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const [status, setStatus] = useState('사진을 끌어다 놓거나 골라 주세요');
  const [options, setOptions] = useState<Map<string, OptionValue>>(() =>
    defaultValues(INFO_BAR_OPTIONS),
  );
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [busy, setBusy] = useState(false);

  const servicesRef = useRef<LayoutServices | null>(null);
  const limitRef = useRef<CanvasLimit | null>(null);
  const frameRef = useRef<number | null>(null);

  // 캔버스 한계 측정은 큰 할당을 여러 번 합니다. 첫 파일을 기다리게 하지 않도록 미리 돌립니다.
  useEffect(() => {
    limitRef.current ??= probeCanvasLimit();
    servicesRef.current ??= { measureText: createMeasurer(), hasLogo: () => false };
    void autoOrientedFlag();
  }, []);

  const repaint = useCallback(() => {
    const canvas = canvasRef.current;
    const services = servicesRef.current;
    const limit = limitRef.current;
    if (!canvas || !loaded || !services || !limit) return;

    const scene = buildScene({
      photoPx: { width: loaded.preview.width, height: loaded.preview.height },
      fields: loaded.fields,
      logoId: undefined,
      layout: infoBarLayout,
      options,
      services,
    });

    paintToCanvas({
      scene,
      canvas,
      photo: loaded.preview.bitmap,
      logo: NO_LOGO,
      targetLongEdge: PREVIEW_LONG_EDGE,
      limit,
    });
  }, [canvasRef, loaded, options]);

  // 옵션이 연달아 바뀌어도 프레임마다 한 번만 그립니다.
  useEffect(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      repaint();
    });
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [repaint]);

  const load = useCallback(async (file: File) => {
    setStatus('읽는 중입니다');
    setLoaded((previous) => {
      previous?.preview.bitmap.close();
      return null;
    });

    try {
      const meta = await readExif(await file.arrayBuffer());
      const autoOriented = await autoOrientedFlag();

      // EXIF 크기는 회전 전 기준입니다. 축이 바뀌는 방향이면 뒤집어서 넘겨야
      // 미리보기 축소 축을 제대로 고릅니다.
      const swap = !autoOriented && swapsAxes(meta.orientation);
      const sourceSize =
        meta.pixelWidth !== undefined && meta.pixelHeight !== undefined
          ? swap
            ? { width: meta.pixelHeight, height: meta.pixelWidth }
            : { width: meta.pixelWidth, height: meta.pixelHeight }
          : undefined;

      const preview = await decodeImage({
        file,
        autoOriented,
        orientation: meta.orientation,
        maxLongEdge: PREVIEW_LONG_EDGE,
        ...(sourceSize ? { sourceSize } : {}),
      });

      setLoaded({ file, meta, fields: toFields(meta), preview });
      setStatus(`${file.name} 을 불러왔어요`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '알 수 없는 오류가 났습니다');
    }
  }, []);

  const setOption = useCallback((id: string, value: OptionValue) => {
    setOptions((previous) => new Map(previous).set(id, value));
  }, []);

  const download = useCallback(async () => {
    const services = servicesRef.current;
    const limit = limitRef.current;
    if (!loaded || !services || !limit) return;

    setBusy(true);
    setStatus('전체 해상도로 그리는 중입니다');
    let full: DecodedImage | null = null;
    try {
      const autoOriented = await autoOrientedFlag();
      full = await decodeImage({ file: loaded.file, autoOriented, orientation: loaded.meta.orientation });

      const scene = buildScene({
        photoPx: { width: full.width, height: full.height },
        fields: loaded.fields,
        logoId: undefined,
        layout: infoBarLayout,
        options,
        services,
      });

      const result = await exportToBlob({
        scene,
        photo: full.bitmap,
        photoLongEdgePx: Math.max(full.width, full.height),
        logo: NO_LOGO,
        limit,
        preset: 'original',
        format: 'image/jpeg',
        quality: 0.92,
      });

      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = loaded.file.name.replace(/\.[^.]+$/, '') + '-halfstop.jpg';
      anchor.click();
      URL.revokeObjectURL(url);

      setStatus(
        result.clamped
          ? `내려받았어요. 기기 한계 때문에 ${result.width}x${result.height}로 줄였어요`
          : `내려받았어요. ${result.width}x${result.height}`,
      );
    } catch (error) {
      setStatus(error instanceof Error ? error.message : '내보내기에 실패했어요');
    } finally {
      full?.bitmap.close();
      setBusy(false);
    }
  }, [loaded, options]);

  return { status, options, setOption, load, download, busy, ready: loaded !== null };
}
```

- [ ] **Step 2: App.tsx 작성**

옵션 패널은 선언 배열을 돌면서 만듭니다. 프리셋을 추가해도 이 코드는 그대로입니다.

```tsx
import { useRef, type ChangeEvent, type DragEvent } from 'react';
import { INFO_BAR_OPTIONS } from '../core/layout/presets/infoBar';
import type { PresetOption } from '../core/layout/options';
import { usePipeline } from './usePipeline';

export function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { status, options, setOption, load, download, busy, ready } = usePipeline(canvasRef);

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file) void load(file);
  };

  const onPick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) void load(file);
  };

  const field = (option: PresetOption) => {
    const value = options.get(option.id);
    switch (option.type) {
      case 'color':
        return (
          <input
            type="color"
            value={String(value)}
            onChange={(e) => setOption(option.id, e.target.value)}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => setOption(option.id, e.target.checked)}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            value={Number(value)}
            onChange={(e) => setOption(option.id, Number(e.target.value))}
          />
        );
      case 'range':
        return (
          <input
            type="range"
            min={option.min}
            max={option.max}
            step={option.step}
            value={Number(value)}
            onChange={(e) => setOption(option.id, Number(e.target.value))}
          />
        );
      case 'select':
        return (
          <select value={String(value)} onChange={(e) => setOption(option.id, e.target.value)}>
            {option.options.map((choice) => (
              <option key={choice} value={choice}>
                {choice}
              </option>
            ))}
          </select>
        );
      case 'text':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => setOption(option.id, e.target.value)}
          />
        );
    }
  };

  return (
    <main style={{ fontFamily: 'system-ui', padding: 24, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>halfstop</h1>

      <div
        onDrop={onDrop}
        onDragOver={(event) => event.preventDefault()}
        style={{ border: '2px dashed #bbb', borderRadius: 12, padding: 24, marginBottom: 16 }}
      >
        <p style={{ margin: '0 0 12px' }}>{status}</p>
        <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onPick} />
      </div>

      <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <canvas
          ref={canvasRef}
          style={{ maxWidth: '100%', flex: 1, background: '#f4f4f4', minHeight: 200 }}
        />

        <aside style={{ width: 260, display: 'grid', gap: 8 }}>
          {INFO_BAR_OPTIONS.map((option) => (
            <label key={option.id} style={{ display: 'grid', gap: 4, fontSize: 13 }}>
              <span>{option.id}</span>
              {field(option)}
            </label>
          ))}
          <button type="button" onClick={() => void download()} disabled={!ready || busy}>
            {busy ? '만드는 중' : '내려받기'}
          </button>
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 3: 타입 검사와 전체 테스트**

```bash
npx tsc -b && npm test
```

기대 결과: 타입 오류 없음, 모든 테스트 통과.

- [ ] **Step 4: 개발 서버로 직접 확인**

```bash
npm run dev
```

브라우저에서 다음을 확인하고 각 항목의 결과를 기록합니다.

1. Sony, Canon, Nikon 중 하나로 찍은 JPEG을 넣습니다. 하단 바에 제조사와 모델, 초점거리, 조리개, 셔터, ISO가 나오는지 봅니다.
2. **세로 사진을 넣습니다. 눕지 않고 똑바로 서는지 봅니다.** 이 계획에서 가장 중요한 확인입니다.
3. Orientation 태그가 붙은 사진과 붙지 않은 사진을 각각 넣어 둘 다 똑바로 서는지 봅니다.
4. EXIF가 없는 이미지를 넣습니다. 오류 없이 바가 비거나 일부만 나오는지 봅니다.
5. 5천만 화소급 대형 JPEG을 넣습니다. 내려받기가 끝나는지, 줄었다면 안내 문구가 나오는지 봅니다.
6. 내려받은 파일을 사진 앱에서 열어 실제로 열리는지 봅니다.
7. 개발자 도구 네트워크 탭을 열어 두고 위 과정을 반복합니다. 이미지가 나가는 요청이 하나도 없어야 합니다.

- [ ] **Step 5: 반응 속도 확인**

이 계획에 반응 속도 요구가 있으므로 눈대중이 아니라 숫자로 확인합니다. 개발자 도구 Performance 패널을 켜고 5천만 화소 JPEG으로 다음을 재고, 결과를 기록합니다.

1. 파일을 놓은 시점부터 미리보기가 뜰 때까지의 시간입니다. 축소 디코딩이 걸렸다면 1초 안쪽이어야 합니다. 몇 초가 걸린다면 `resizeHint`가 `{}`를 돌려주고 있다는 뜻이므로, EXIF에 원본 크기가 있는지부터 확인합니다.
2. 바 높이 슬라이더를 끝까지 끌 때의 프레임 흐름입니다. 디코딩이 다시 일어나면 안 됩니다. Performance 기록에 `createImageBitmap`이 보이면 미리보기 경로에 디코딩이 섞인 것입니다.
3. 색상과 템플릿 문자열을 바꿀 때도 같은지 봅니다.

- [ ] **Step 6: 커밋**

```bash
git add src/ui
git commit -m "미리보기 캔버스와 옵션 패널을 갖춘 UI 추가

Co-Authored-By: Claude Opus 5 <noreply@anthropic.com>"
```

---

## 이 계획을 마치면 확보되는 것

- JPEG, PNG, WebP를 넣어 하단 정보 바가 붙은 이미지를 내려받을 수 있습니다.
- 옵션을 만지면 미리보기가 곧바로 따라옵니다. 디코딩은 파일당 한 번이고, 전체 해상도 작업은 내려받을 때만 일어납니다.
- 미리보기와 내보내기가 어긋나지 않는다는 보장이 테스트로 붙어 있습니다.
- 캔버스 한계와 방향 회전이라는 두 가지 조용한 실패 원인이 잡혀 있습니다.
- 옵션 패널이 선언에서 자동으로 만들어지므로, 프리셋을 늘릴 때 UI 코드를 새로 쓰지 않습니다.

## 다음 계획에서 다루는 것

브랜드 정규화와 로고 `Path2D` 빌드 스텝, 폰트 로딩, EXIF 수동 편집 패널, 한국어와 영어 사전입니다. 그 뒤가 나머지 프리셋 두 개, HEIC, RAW, 배치와 ZIP입니다.
