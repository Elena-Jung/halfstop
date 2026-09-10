import { describe, expect, it } from 'vitest';
import { ARRANGEMENTS } from '../core/layout/arrangements';
import { BAR_OPTIONS } from '../core/layout/layouts/bar';
import { MATTE_OPTIONS } from '../core/layout/layouts/matte';
import { arrangementsForLayout, groupOptions, RAIL_TABS } from './groups';

describe('groupOptions', () => {
  it('선언 순서를 지키며 묶음별로 나눕니다', () => {
    const grouped = groupOptions(BAR_OPTIONS);
    const flat = [...grouped.frame, ...grouped.arrangement];
    expect(flat.length).toBe(BAR_OPTIONS.length);
    for (const group of ['frame', 'arrangement'] as const) {
      const ids = grouped[group].map((o) => o.id);
      const expected = BAR_OPTIONS.filter((o) => o.groupKey === group).map((o) => o.id);
      expect(ids).toEqual(expected);
    }
  });

  it('두 레이아웃 모두 어느 묶음도 비지 않습니다', () => {
    for (const options of [BAR_OPTIONS, MATTE_OPTIONS]) {
      const grouped = groupOptions(options);
      expect(grouped.frame.length).toBeGreaterThan(0);
      expect(grouped.arrangement.length).toBeGreaterThan(0);
    }
  });

  it('레일 칸은 네 개이고 순서가 정해져 있습니다', () => {
    expect(RAIL_TABS).toEqual(['preset', 'frame', 'arrangement', 'export']);
  });
});

describe('arrangementsForLayout', () => {
  it('그 레이아웃을 쓸 수 있는 배치만 남깁니다', () => {
    for (const layout of ['bar', 'matte'] as const) {
      const result = arrangementsForLayout(layout);
      expect(result.length).toBeGreaterThan(0);
      for (const arrangement of result) {
        expect(arrangement.layouts.includes(layout), arrangement.id).toBe(true);
      }
    }
  });

  it('프리셋에서 뽑은 아홉 배치는 한 레이아웃에만 속하고 한 덩이만 양쪽에 속합니다', () => {
    // 아홉 배치는 프리셋에서 1:1 로 뽑아 그 프리셋의 레이아웃에만 묶여 있습니다. 다른
    // 레이아웃에서도 뜻이 통하는지 검증하지 않았기 때문입니다. one-block 은 프리셋에서 뽑은
    // 것이 아니라 사용자 요구로 새로 만든 것이고, 꼬리 줄을 쓰지 않고 single 모드만 써서
    // 양쪽에서 뜻이 통합니다.
    const both = ARRANGEMENTS.filter((a) => a.layouts.length > 1).map((a) => a.id);
    expect(both).toEqual(['one-block']);

    const bar = arrangementsForLayout('bar');
    const matte = arrangementsForLayout('matte');
    expect(bar.length + matte.length).toBe(ARRANGEMENTS.length + both.length);
  });
});
