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

  it('조각을 하나 이상 담고 있습니다', () => {
    for (const logo of LOGOS) {
      expect(logo.parts.length, logo.id).toBeGreaterThan(0);
    }
  });

  it('조각의 d 가 비어 있지 않고 M 이나 m 으로 시작합니다', () => {
    for (const logo of LOGOS) {
      for (const [index, part] of logo.parts.entries()) {
        expect(part.d.length, `${logo.id}[${index}]`).toBeGreaterThan(0);
        expect(['M', 'm'], `${logo.id}[${index}]`).toContain(part.d[0]);
      }
    }
  });

  it('조각의 d 에 NaN 이나 undefined 같은 문자열이 섞이지 않습니다', () => {
    for (const logo of LOGOS) {
      for (const part of logo.parts) {
        for (const suspect of SUSPECT_STRINGS) {
          expect(part.d.includes(suspect), `${logo.id}: ${suspect}`).toBe(false);
        }
      }
    }
  });

  it('채우기 규칙을 적었다면 evenodd 뿐입니다', () => {
    // nonzero 는 기본값이라 적지 않습니다. 다른 값이 들어오면 그리는 쪽이 조용히
    // 무시하므로 데이터에서 막습니다.
    for (const logo of LOGOS) {
      for (const part of logo.parts) {
        if (part.fillRule !== undefined) {
          expect(part.fillRule, logo.id).toBe('evenodd');
        }
      }
    }
  });

  it('행렬을 적었다면 유한한 수 여섯 개입니다', () => {
    for (const logo of LOGOS) {
      for (const [index, part] of logo.parts.entries()) {
        if (part.transform === undefined) continue;
        expect(part.transform.length, `${logo.id}[${index}]`).toBe(6);
        for (const value of part.transform) {
          expect(Number.isFinite(value), `${logo.id}[${index}]: ${value}`).toBe(true);
        }
      }
    }
  });

  it('행렬이 있다면 납작하지 않습니다', () => {
    // a*d - b*c 가 0 이면 조각이 선으로 눌려 아무것도 안 보입니다. 행렬을 손으로
    // 옮기다 자릿수를 빠뜨리면 이렇게 됩니다.
    for (const logo of LOGOS) {
      for (const [index, part] of logo.parts.entries()) {
        if (part.transform === undefined) continue;
        const [a, b, c, d] = part.transform;
        expect(Math.abs(a * d - b * c), `${logo.id}[${index}]`).toBeGreaterThan(0);
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

  it('color 를 적었다면 소문자 여섯 자리 16진수입니다', () => {
    // TEXT_COLOR, BACKGROUND 와 같은 표기(소문자, #rrggbb)를 맞춥니다.
    const HEX_COLOR_PATTERN = /^#[0-9a-f]{6}$/;
    for (const logo of LOGOS) {
      if (logo.color === undefined) continue;
      expect(HEX_COLOR_PATTERN.test(logo.color), `${logo.id}: ${logo.color}`).toBe(true);
    }
  });

  it('공식 마크가 검정이거나 여러 색인 브랜드는 color 를 비워 둡니다', () => {
    // .superpowers/sdd/logo-brand-color-report.md 에 브랜드별 근거를 적었습니다.
    // 소니, 애플, DJI, 시그마, 핫셀블라드는 공식 마크가 검정(또는 검정에 아주
    // 가까운 단색)이고, 구글과 올림푸스는 원본이 여러 색이라 단색 경로로 표현할
    // 수 없습니다.
    const NO_COLOR_IDS = ['sony', 'apple', 'google', 'dji', 'sigma', 'olympus', 'hasselblad'];
    for (const id of NO_COLOR_IDS) {
      const logo = LOGOS.find((entry) => entry.id === id);
      expect(logo?.color, id).toBeUndefined();
    }
  });
});
