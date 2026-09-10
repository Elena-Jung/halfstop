import { describe, expect, it } from 'vitest';
import { LOGOS } from './logoData';

/**
 * Path2D 는 브라우저 API 라 environment: 'node' 인 이 테스트에서 쓸 수 없습니다. 그래서
 * 여기서는 데이터의 모양만 봅니다. 경로가 실제로 그 브랜드처럼 보이는지는 사람이 브라우저로
 * 눈으로 확인했고 그 방법과 결과를 .superpowers/sdd/logo-data-report.md 에 적었습니다.
 */
const ALLOWED_LICENSES = ['CC0-1.0', 'Public domain'];

const ID_PATTERN = /^[a-z0-9-]+$/;
const SUSPECT_STRINGS = ['NaN', 'undefined'];

describe('LOGOS', () => {
  it('항목을 하나 이상 담고 있습니다', () => {
    expect(LOGOS.length).toBeGreaterThan(0);
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

  it('viewBox 의 두 값이 모두 0 보다 큽니다', () => {
    for (const logo of LOGOS) {
      expect(logo.viewBox.width, logo.id).toBeGreaterThan(0);
      expect(logo.viewBox.height, logo.id).toBeGreaterThan(0);
    }
  });

  it('path 가 비어 있지 않고 M 이나 m 으로 시작합니다', () => {
    for (const logo of LOGOS) {
      expect(logo.path.length, logo.id).toBeGreaterThan(0);
      expect(['M', 'm'], logo.id).toContain(logo.path[0]);
    }
  });

  it('path 에 NaN 이나 undefined 같은 문자열이 섞이지 않습니다', () => {
    for (const logo of LOGOS) {
      for (const suspect of SUSPECT_STRINGS) {
        expect(logo.path.includes(suspect), `${logo.id}: ${suspect}`).toBe(false);
      }
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
});
