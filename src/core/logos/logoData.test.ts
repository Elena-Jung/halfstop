import { describe, expect, it } from 'vitest';
import { readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { LOGOS } from './logoData';

/**
 * 데이터가 파일과 어긋나면 로고가 늘어나거나 아예 안 나옵니다. 그런데 그 어긋남은
 * 조용합니다. 그리는 쪽은 데이터의 비율대로 상자를 잡고 비트맵을 그 상자에 늘려 넣을
 * 뿐이라 아무 오류도 나지 않습니다. 그래서 여기서는 실제 PNG 를 열어 대조합니다.
 *
 * 이 테스트는 워커에서 돌지 않으므로 node:fs 를 직접 씁니다. coreBoundary.test.ts 가
 * 같은 자리에서 같은 이유로 그렇게 합니다.
 */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LOGO_DIR = join(ROOT, 'public', 'logos');

const ALLOWED_LICENSES = ['Public domain'];
const ID_PATTERN = /^[a-z0-9-]+$/;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/**
 * PNG 는 서명 8바이트 뒤에 반드시 IHDR 청크가 오고, 그 데이터의 첫 여덟 바이트가 가로와
 * 세로입니다. 규격이 정한 순서라 앞머리만 읽으면 됩니다. 이미지 라이브러리를 새로 들이지
 * 않으려고 직접 읽습니다.
 */
function pngSize(file: string): { width: number; height: number } {
  const head = readFileSync(join(LOGO_DIR, file)).subarray(0, 24);
  expect(head.subarray(0, 8).equals(PNG_SIGNATURE), `${file}: PNG 서명`).toBe(true);
  expect(head.subarray(12, 16).toString('ascii'), `${file}: 첫 청크`).toBe('IHDR');
  return { width: head.readUInt32BE(16), height: head.readUInt32BE(20) };
}

describe('LOGOS', () => {
  it('스물다섯 개를 담고 있습니다', () => {
    expect(LOGOS.length).toBe(25);
  });

  it('id 가 소문자와 하이픈, 숫자만 씁니다', () => {
    for (const logo of LOGOS) {
      expect(ID_PATTERN.test(logo.id), logo.id).toBe(true);
    }
  });

  it('id 가 서로 겹치지 않습니다', () => {
    const ids = LOGOS.map((logo) => logo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('파일 이름이 id 에 .png 를 붙인 것입니다', () => {
    for (const logo of LOGOS) {
      expect(logo.file, logo.id).toBe(`${logo.id}.png`);
    }
  });

  it('적어 둔 파일이 public/logos 아래에 실제로 있습니다', () => {
    for (const logo of LOGOS) {
      expect(statSync(join(LOGO_DIR, logo.file)).isFile(), logo.file).toBe(true);
    }
  });

  it('width 와 height 가 PNG 의 실제 픽셀 크기와 같습니다', () => {
    // 이 값이 어긋나면 layout() 이 잡은 상자 비율과 그림의 비율이 달라 로고가 늘어납니다.
    for (const logo of LOGOS) {
      expect(pngSize(logo.file), logo.id).toEqual({ width: logo.width, height: logo.height });
    }
  });

  it('source 와 license 가 모두 채워져 있습니다', () => {
    for (const logo of LOGOS) {
      expect(logo.source.length, logo.id).toBeGreaterThan(0);
      expect(logo.license.length, logo.id).toBeGreaterThan(0);
    }
  });

  it('license 가 허용 목록에 있습니다', () => {
    for (const logo of LOGOS) {
      expect(ALLOWED_LICENSES, logo.id).toContain(logo.license);
    }
  });

  it('잉크가 무채색 검정인 일곱 개만 darkInk 입니다', () => {
    // 그리는 쪽은 이 칸만 보고 물들일지 정합니다. 브랜드 id 를 코드에 늘어놓지 않는
    // 대신, 어느 브랜드가 어느 쪽인지는 여기서 못박습니다. 근거는
    // .superpowers/sdd/real-logo-report.md 에 픽셀 값으로 적었습니다.
    const dark = LOGOS.filter((logo) => logo.darkInk).map((logo) => logo.id);
    expect([...dark].sort()).toEqual(
      ['apple', 'fujifilm', 'gopro', 'hasselblad', 'sigma', 'sony', 'viltrox'].sort(),
    );
  });
});
