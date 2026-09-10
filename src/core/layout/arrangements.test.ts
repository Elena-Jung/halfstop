import { describe, expect, it } from 'vitest';
import {
  ARRANGEMENTS,
  DEFAULT_ARRANGEMENT_ID,
  arrangementById,
  arrangementValuesFor,
} from './arrangements';

const VALUE_KEYS = [
  'MODE',
  'ALIGN',
  'DIVIDER',
  'PRIMARY_MAIN',
  'PRIMARY_SUB',
  'SECONDARY_MAIN',
  'SECONDARY_SUB',
  'FOOTER',
];

describe('ARRANGEMENTS', () => {
  it('아홉 프리셋에서 뽑은 아홉 개에 한 덩이 하나를 더해 열 개입니다', () => {
    expect(ARRANGEMENTS).toHaveLength(10);
  });

  it('id 가 겹치지 않습니다', () => {
    expect(new Set(ARRANGEMENTS.map((a) => a.id)).size).toBe(10);
  });

  it('모든 배치에 이름표 키가 있습니다', () => {
    for (const arrangement of ARRANGEMENTS) {
      expect(arrangement.labelKey.length).toBeGreaterThan(0);
    }
  });

  it('labelKey 는 arrangement. 으로 시작하고 id 를 그대로 씁니다', () => {
    for (const arrangement of ARRANGEMENTS) {
      expect(arrangement.labelKey).toBe(`arrangement.${arrangement.id}`);
    }
  });

  it('한국어 문자열을 labelKey 에 직접 담지 않습니다', () => {
    for (const arrangement of ARRANGEMENTS) {
      expect(/[가-힣]/.test(arrangement.labelKey), arrangement.id).toBe(false);
    }
  });

  it('values 가 여덟 값을 통째로 갖습니다. 일부만 남기지 않습니다', () => {
    for (const arrangement of ARRANGEMENTS) {
      expect(Object.keys(arrangement.values).sort(), arrangement.id).toEqual(
        [...VALUE_KEYS].sort(),
      );
    }
  });

  it('layouts 가 비어 있지 않고 bar 나 matte 만 담습니다', () => {
    for (const arrangement of ARRANGEMENTS) {
      expect(arrangement.layouts.length, arrangement.id).toBeGreaterThan(0);
      for (const layout of arrangement.layouts) {
        expect(['bar', 'matte']).toContain(layout);
      }
    }
  });

  it('MODE 가 poster 인 배치는 bar 를 쓸 수 없습니다', () => {
    // bar.ts 에는 poster 분기가 없어 else 로 떨어져 split 처럼 그려집니다. layouts 가 이를
    // 막는 유일한 방어선이므로 데이터 자체가 이 규칙을 어기지 않는지 못박아 둡니다.
    for (const arrangement of ARRANGEMENTS) {
      if (arrangement.values.MODE !== 'poster') continue;
      expect(arrangement.layouts, arrangement.id).not.toContain('bar');
    }
  });
});

describe('arrangementById', () => {
  it('id 로 찾습니다', () => {
    expect(arrangementById(DEFAULT_ARRANGEMENT_ID).id).toBe(DEFAULT_ARRANGEMENT_ID);
  });

  it('모르는 id 는 기본 배치로 떨어집니다', () => {
    expect(arrangementById('없는-id').id).toBe(DEFAULT_ARRANGEMENT_ID);
  });
});

describe('arrangementValuesFor', () => {
  it('layouts 에 있는 레이아웃이면 값을 그대로 돌려줍니다', () => {
    const bodyLens = arrangementById('body-lens');
    expect(arrangementValuesFor(bodyLens, 'bar')).toBe(bodyLens.values);
  });

  it('layouts 에 없는 레이아웃이면 던집니다', () => {
    // poster 배치를 bar 에 억지로 밀어 넣는 경우입니다. Arrangement 가 MODE 를 통째로
    // 넘기므로 BAR_OPTIONS 의 select 목록이 더는 poster 를 막아 주지 않습니다. 이 검사가
    // 유일한 방어선입니다.
    const poster = arrangementById('poster');
    expect(() => arrangementValuesFor(poster, 'bar')).toThrow();
  });

  it('모든 배치가 자신이 뽑혀 나온 프리셋의 레이아웃에서는 던지지 않습니다', () => {
    for (const arrangement of ARRANGEMENTS) {
      for (const layout of arrangement.layouts) {
        expect(() => arrangementValuesFor(arrangement, layout)).not.toThrow();
      }
    }
  });
});
