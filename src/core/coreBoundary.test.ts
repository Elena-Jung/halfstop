import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * src/core 아래는 react 를 import 하지 않고 document, window, localStorage 같은
 * 전역을 직접 참조하지 않습니다. 전체 해상도 내보내기가 Web Worker 에서 돌기 때문입니다.
 * tsconfig.json 은 프로젝트 전체에 DOM 라이브러리를 넣어 두었으므로 tsc 는 이 경계를
 * 지켜 주지 않습니다. 이 테스트가 그 자리를 대신합니다. 워커에서는 돌지 않으므로
 * node:fs 를 직접 쓸 수 있습니다.
 */
const CORE_DIR = dirname(fileURLToPath(import.meta.url));

function listSourceFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      files.push(...listSourceFiles(full));
      continue;
    }
    if (entry.endsWith('.ts') && !entry.endsWith('.test.ts')) files.push(full);
  }
  return files;
}

/**
 * 블록 주석과 줄 주석을 걷어 냅니다. 완벽한 파서는 아니지만, 주석 안의 낱말이
 * 검사에 걸리지 않게 하는 데는 이 정도로 충분합니다.
 */
function stripComments(source: string): string {
  const withoutBlockComments = source.replace(/\/\*[\s\S]*?\*\//g, '');
  return withoutBlockComments
    .split('\n')
    .map((line) => {
      const index = line.indexOf('//');
      return index === -1 ? line : line.slice(0, index);
    })
    .join('\n');
}

const FORBIDDEN_GLOBALS = [
  'document',
  'window',
  'localStorage',
  'sessionStorage',
  'navigator',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
];

const REACT_IMPORT = /(?:from\s+|require\(\s*)['"]react(?:[/-][\w-]+)?['"]/;

describe('src/core 의 DOM 격리', () => {
  const files = listSourceFiles(CORE_DIR);

  it('검사할 파일을 하나 이상 찾습니다', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  for (const file of files) {
    const label = relative(CORE_DIR, file);

    it(`${label}: react 를 import 하지 않습니다`, () => {
      const code = stripComments(readFileSync(file, 'utf-8'));
      expect(REACT_IMPORT.test(code)).toBe(false);
    });

    it(`${label}: document/window/localStorage 등을 참조하지 않습니다`, () => {
      const code = stripComments(readFileSync(file, 'utf-8'));
      for (const name of FORBIDDEN_GLOBALS) {
        const pattern = new RegExp(`\\b${name}\\b`);
        expect(pattern.test(code), `${label} 에서 ${name} 을 참조합니다`).toBe(false);
      }
    });
  }
});
