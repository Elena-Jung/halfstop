import { Download, Frame, LayoutGrid, Type, type LucideIcon } from 'lucide-react';
import type { KeyboardEvent } from 'react';
import { t, type MessageKey } from '../i18n';
import { RAIL_TABS, railPanelId, railTabId, type RailTab } from './groups';

const ICON_BY_TAB: Record<RailTab, LucideIcon> = {
  preset: LayoutGrid,
  frame: Frame,
  text: Type,
  export: Download,
};

const LABEL_KEY_BY_TAB: Record<RailTab, MessageKey> = {
  preset: 'rail.preset',
  frame: 'rail.frame',
  text: 'rail.text',
  export: 'rail.export',
};

/**
 * 넓은 화면의 세로 레일과 좁은 화면의 가로 탭 바를 하나의 tablist 로 그립니다. 두 배치는
 * 구조가 같고 aria-orientation 과 화살표 방향만 다릅니다.
 */
export function Rail(props: {
  selected: RailTab;
  onSelect: (tab: RailTab) => void;
  orientation: 'vertical' | 'horizontal';
  disabled: boolean;
}) {
  const { selected, onSelect, orientation, disabled } = props;

  const focusTab = (tab: RailTab) => {
    document.getElementById(railTabId(tab))?.focus();
  };

  const moveBy = (delta: number) => {
    const index = RAIL_TABS.indexOf(selected);
    const next = RAIL_TABS[(index + delta + RAIL_TABS.length) % RAIL_TABS.length]!;
    onSelect(next);
    focusTab(next);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;
    const forwardKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const backwardKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';

    if (event.key === forwardKey) {
      event.preventDefault();
      moveBy(1);
    } else if (event.key === backwardKey) {
      event.preventDefault();
      moveBy(-1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      const first = RAIL_TABS[0]!;
      onSelect(first);
      focusTab(first);
    } else if (event.key === 'End') {
      event.preventDefault();
      const last = RAIL_TABS[RAIL_TABS.length - 1]!;
      onSelect(last);
      focusTab(last);
    }
  };

  return (
    <div
      role="tablist"
      aria-label={t('rail.label')}
      aria-orientation={orientation}
      onKeyDown={onKeyDown}
      className="rail"
      data-orientation={orientation}
    >
      {RAIL_TABS.map((tab) => {
        const Icon = ICON_BY_TAB[tab];
        const isSelected = tab === selected;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            id={railTabId(tab)}
            aria-controls={railPanelId(tab)}
            aria-selected={isSelected}
            aria-label={t(LABEL_KEY_BY_TAB[tab])}
            tabIndex={isSelected ? 0 : -1}
            disabled={disabled}
            onClick={() => onSelect(tab)}
            className="rail-tab"
            data-selected={isSelected}
          >
            <Icon aria-hidden="true" size={20} />
          </button>
        );
      })}
    </div>
  );
}
