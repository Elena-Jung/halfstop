import { ARRANGEMENTS, type Arrangement } from '../core/layout/arrangements';
import type { OptionGroup, PresetOption } from '../core/layout/options';

export type RailTab = 'preset' | OptionGroup | 'export';

/** 레일에 보일 순서입니다. 프리셋을 먼저 고르고 그 위에서 다듬는 흐름을 따릅니다. */
export const RAIL_TABS: readonly RailTab[] = ['preset', 'frame', 'arrangement', 'export'];

/** 탭 단추와 그 단추가 여는 패널을 aria-controls/aria-labelledby 로 잇는 id 입니다. */
export function railTabId(tab: RailTab): string {
  return `rail-tab-${tab}`;
}

export function railPanelId(tab: RailTab): string {
  return `rail-panel-${tab}`;
}

export function groupOptions(
  options: readonly PresetOption[],
): Record<OptionGroup, readonly PresetOption[]> {
  const frame: PresetOption[] = [];
  const arrangement: PresetOption[] = [];
  for (const option of options) {
    if (option.groupKey === 'frame') frame.push(option);
    else arrangement.push(option);
  }
  return { frame, arrangement };
}

/**
 * 지금 프레임의 레이아웃에서 쓸 수 있는 배치만 돌려줍니다. 골랐다가 안 되는 것을
 * 배우게 하지 않도록, 배치 카드 목록에는 이 결과만 보입니다.
 */
export function arrangementsForLayout(layout: 'bar' | 'matte'): readonly Arrangement[] {
  return ARRANGEMENTS.filter((arrangement) => arrangement.layouts.includes(layout));
}
