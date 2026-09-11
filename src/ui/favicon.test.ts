import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 파비콘이 실제로 브라우저가 그릴 수 있는 파일인지 검사합니다.
 *
 * 처음 만든 파일은 주석에 CSS 토큰 이름을 그대로 적었다가(`--bg` 같은 것) 통째로
 * 유효하지 않은 XML 이 되어 어떤 브라우저도 그리지 못했습니다. XML 은 주석 안에 이중
 * 하이픈을 금지합니다. 파일은 200 으로 잘 전달되고 content-type 도 맞아서 겉으로는
 * 멀쩡해 보였고, 확인할 때 파일을 이미지로 불러오지 않고 마크업 본문만 따로 그려 본
 * 탓에 드러나지 않았습니다.
 *
 * 이 검사는 "만든 것을 쓰이는 방식 그대로 확인한다" 는 규칙을 기계로 옮긴 것입니다.
 */
const HERE = dirname(fileURLToPath(import.meta.url));
const FAVICON_PATH = join(HERE, '..', '..', 'public', 'favicon.svg');
const SVG = readFileSync(FAVICON_PATH, 'utf-8');

describe('파비콘', () => {
  it('주석 안에 이중 하이픈이 없습니다', () => {
    const offenders = [...SVG.matchAll(/<!--([\s\S]*?)-->/g)]
      .map((match) => match[1] ?? '')
      .filter((body) => body.includes('--'));
    expect(offenders).toEqual([]);
  });

  it('주석을 여는 표시와 닫는 표시의 개수가 같습니다', () => {
    // 위 검사는 짝이 맞는 주석만 봅니다. 짝이 어긋나면 그 자체로 유효하지 않은 XML 이고
    // 위 검사는 통과해 버리므로 여기서 따로 붙잡습니다.
    expect((SVG.match(/<!--/g) ?? []).length).toBe((SVG.match(/-->/g) ?? []).length);
  });

  it('viewBox 와 그릴 요소가 있습니다', () => {
    expect(SVG).toContain('viewBox="0 0 32 32"');
    expect(/<(path|rect|circle|polygon)\b/.test(SVG)).toBe(true);
  });

  it('색이 앱의 중성 회색 토큰과 같습니다', () => {
    // CSS 변수는 이 파일까지 닿지 않으므로 값을 직접 적습니다. 토큰이 바뀌면 여기가
    // 실패해서 함께 고쳐야 한다는 것을 알려 줍니다.
    const css = readFileSync(join(HERE, '..', 'assets', 'ui.css'), 'utf-8');
    const token = (name: string) => {
      const found = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`).exec(css);
      if (!found) throw new Error(`ui.css 에서 --${name} 을 찾지 못했습니다`);
      return found[1]!;
    };
    expect(SVG).toContain(token('bg'));
    expect(SVG).toContain(token('text'));
    expect(SVG).toContain(token('accent'));
  });
});
