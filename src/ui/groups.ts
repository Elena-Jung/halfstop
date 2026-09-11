import { ARRANGEMENTS, type Arrangement } from '../core/layout/arrangements';
import type { OptionGroup, PresetOption } from '../core/layout/options';

export type RailTab = 'preset' | OptionGroup | 'export';

/**
 * 레일에 보일 순서입니다. 프리셋으로 프레임 모양을 고르고, 배치로 무엇을 적을지 정한 뒤,
 * 세부조정에서 수치를 다듬고 마지막에 내려받는 흐름입니다. 사용자가 정한 우선순위입니다.
 */
export const RAIL_TABS: readonly RailTab[] = ['preset', 'arrangement', 'frame', 'export'];

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
