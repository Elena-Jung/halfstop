import { describe, expect, it } from 'vitest';
import {
  ARRANGEMENTS,
  DEFAULT_ARRANGEMENT_BY_LAYOUT,
  arrangementById,
  arrangementForLayout,
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
  it('예전 아홉 프리셋에서 뽑은 아홉 개에 한 덩이와 노출과 장비를 더해 열한 개입니다', () => {
    expect(ARRANGEMENTS).toHaveLength(11);
  });

  it('id 가 겹치지 않습니다', () => {
    expect(new Set(ARRANGEMENTS.map((a) => a.id)).size).toBe(11);
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

  it('기본 배치는 장비 줄에서 제조사를 말하지 않습니다', () => {
    // 세 프리셋이 로고를 기본으로 켜므로 브랜드는 로고 자리가 맡습니다. 여기에 {MAKER}가
    // 남아 있으면 로고가 워드마크인 브랜드에서 "SONY │ SONY A7M3" 처럼 이름이 두 번
    // 나옵니다. 사용자가 일부러 고르는 다른 배치는 그대로 두었습니다.
    const values = arrangementById('exposure-gear').values;
    expect(values.SECONDARY_MAIN).toBe('{BODY}');
    expect(values.PRIMARY_MAIN).not.toContain('{MAKER}');
    expect(values.PRIMARY_SUB).not.toContain('{MAKER}');
    expect(values.SECONDARY_SUB).not.toContain('{MAKER}');
  });

  it('기본이 아닌 배치의 {MAKER}는 그대로 남아 있습니다', () => {
    // 제조사가 문장의 일부인 것(shot-on)도 있어 한꺼번에 걷어내지 않았습니다.
    expect(arrangementById('shot-on').values.PRIMARY_MAIN).toContain('{MAKER}');
    expect(arrangementById('body-lens').values.PRIMARY_MAIN).toContain('{MAKER}');
    expect(arrangementById('polaroid').values.PRIMARY_MAIN).toContain('{MAKER}');
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
    expect(arrangementById('poster').id).toBe('poster');
  });

  it('모르는 id 는 목록의 첫 배치로 떨어집니다', () => {
    expect(arrangementById('없는-id').id).toBe(ARRANGEMENTS[0]!.id);
  });
});

describe('DEFAULT_ARRANGEMENT_BY_LAYOUT', () => {
  it('두 레이아웃 모두 자기 레이아웃에서 쓸 수 있는 배치를 가리킵니다', () => {
    for (const layout of ['bar', 'matte'] as const) {
      const arrangement = arrangementById(DEFAULT_ARRANGEMENT_BY_LAYOUT[layout]);
      expect(arrangement.id, layout).toBe(DEFAULT_ARRANGEMENT_BY_LAYOUT[layout]);
      expect(arrangement.layouts, layout).toContain(layout);
    }
  });
});

describe('arrangementForLayout', () => {
  it('그 레이아웃에서 쓸 수 있으면 그대로 둡니다', () => {
    // 프레임을 바꿔도 배치가 따라 바뀌지 않는 자리입니다.
    expect(arrangementForLayout('one-line', 'bar').id).toBe('one-line');
    expect(arrangementForLayout('one-block', 'matte').id).toBe('one-block');
  });

  it('그 레이아웃에서 쓸 수 없으면 기본 배치로 떨어집니다', () => {
    // body-lens 는 꼬리 줄을 써서 bar 전용입니다.
    expect(arrangementForLayout('body-lens', 'matte').id).toBe('polaroid');
    // poster 는 matte 전용입니다. bar 에 새면 split 처럼 그려집니다.
    expect(arrangementForLayout('poster', 'bar').id).toBe('exposure-gear');
  });

  it('모르는 id 와 없는 값은 기본 배치로 떨어집니다', () => {
    expect(arrangementForLayout('없는-id', 'bar').id).toBe('exposure-gear');
    expect(arrangementForLayout(undefined, 'matte').id).toBe('polaroid');
  });

  it('돌려준 배치는 언제나 그 레이아웃에서 쓸 수 있습니다', () => {
    for (const layout of ['bar', 'matte'] as const) {
      for (const arrangement of [...ARRANGEMENTS.map((a) => a.id), '없는-id', undefined]) {
        const resolved = arrangementForLayout(arrangement, layout);
        expect(resolved.layouts, `${arrangement} -> ${layout}`).toContain(layout);
      }
    }
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
