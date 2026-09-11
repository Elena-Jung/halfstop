import { Download, Frame, LayoutGrid, Type, type LucideIcon } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { t, type MessageKey } from '../i18n';
import { RAIL_TABS, railPanelId, railTabId, type RailTab } from './groups';

const ICON_BY_TAB: Record<RailTab, LucideIcon> = {
  preset: LayoutGrid,
  frame: Frame,
  arrangement: Type,
  export: Download,
};

const LABEL_KEY_BY_TAB: Record<RailTab, MessageKey> = {
  preset: 'rail.preset',
  frame: 'rail.frame',
  arrangement: 'rail.arrangement',
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
  /** 마크 바로 아래에 놓을 파일 고르기입니다. tablist 밖에 둡니다. */
  filePicker: ReactNode;
  /** 레일 맨 끝에 놓을 요소입니다. 지금은 테마 선택기 하나입니다. */
  themeToggle: ReactNode;
}) {
  const { selected, onSelect, orientation, disabled, filePicker, themeToggle } = props;

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
    <div className="rail" data-orientation={orientation}>
      {/*
       * 마크는 장식입니다. 도구 이름은 같은 자리의 sr-only h1 과 브라우저 탭 제목이
       * 말합니다. 파비콘과 같은 파일을 써서 두 벌로 갈라지지 않게 합니다.
       */}
      <img src="/favicon.svg" alt="" className="rail-mark" />

      {/*
       * 사진을 넣는 일은 칸을 고르는 일과 성격이 다르므로 선 하나로 탭과 가릅니다.
       * tablist 밖에 두어야 화면 낭독기가 탭 개수를 바르게 셉니다.
       */}
      <div className="rail-pick-slot">{filePicker}</div>

      {/*
       * tablist 안에는 탭만 둡니다. 마크와 테마 단추를 그 안에 넣으면 화면 낭독기가
       * 탭 개수를 잘못 셉니다. 그래서 감싸는 요소를 따로 두었습니다.
       */}
      <div
        role="tablist"
        aria-label={t('rail.label')}
        aria-orientation={orientation}
        onKeyDown={onKeyDown}
        className="rail-tabs"
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

      <div className="rail-foot">{themeToggle}</div>
    </div>
  );
}
