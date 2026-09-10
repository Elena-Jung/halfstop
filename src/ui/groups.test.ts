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

  it('지금 데이터에서는 아홉 배치가 bar 아니면 matte 딱 하나에만 속합니다', () => {
    const bar = arrangementsForLayout('bar');
    const matte = arrangementsForLayout('matte');
    expect(bar.length + matte.length).toBe(ARRANGEMENTS.length);
  });
});
