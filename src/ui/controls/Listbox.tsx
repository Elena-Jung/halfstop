import { ChevronDown } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { initialActiveIndex, typeaheadIndex, wrapIndex } from './listboxLogic';

export interface ListboxOption<T extends string = string> {
  readonly value: T;
  readonly label: string;
}

/** 글자 입력으로 찾아가는 버퍼가 비는 데 걸리는 시간입니다. */
const TYPEAHEAD_RESET_MS = 500;

/**
 * `select` 를 대체합니다. WAI-ARIA 의 combobox(목록 상자를 여는 형태) 패턴을 따릅니다.
 * 실제 DOM 초점은 트리거 단추에 그대로 두고, `aria-activedescendant` 로 지금 가리키는
 * 항목을 알립니다. 초점을 목록 쪽으로 옮기면 닫을 때 되돌리는 자리에서 실수가 나기
 * 쉬워 이 방식을 씁니다.
 *
 * `renderOption` 을 주면 항목에 임의의 내용을 그릴 수 있습니다. 서체 이름을 그 서체로
 * 보이는 것처럼, 기본 `select` 로는 못 하던 일이라 이 컴포넌트를 만든 실질적인 이유입니다.
 */
export function Listbox<T extends string = string>(props: {
  /** 트리거 단추의 id 와 목록/항목 id 를 만드는 바탕입니다. */
  id: string;
  /** 트리거의 접근 가능한 이름입니다. 화면에 보이는 이름표 문구를 그대로 넘기십시오. */
  label: string;
  value: T;
  options: readonly ListboxOption<T>[];
  onChange: (value: T) => void;
  disabled?: boolean;
  renderOption?: (option: ListboxOption<T>) => ReactNode;
}) {
  const { id, label, value, options, onChange, disabled = false, renderOption } = props;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typeaheadRef = useRef<{ buffer: string; timer: ReturnType<typeof setTimeout> | null }>({
    buffer: '',
    timer: null,
  });

  const values = options.map((option) => option.value);
  const labels = options.map((option) => option.label);
  const selectedOption = options.find((option) => option.value === value);

  const listboxId = `${id}-listbox`;
  const optionId = (index: number) => `${id}-option-${index}`;

  const close = () => {
    setOpen(false);
    setActiveIndex(null);
  };

  const openList = () => {
    if (disabled || options.length === 0) return;
    setActiveIndex(initialActiveIndex(values, value));
    setOpen(true);
  };

  const commit = (index: number) => {
    const option = options[index];
    if (!option) return;
    onChange(option.value);
    close();
  };

  // 바깥을 누르면 닫습니다.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // 아래로 펼치면 화면 밖으로 넘칠 때만 트리거 위쪽으로 바꿔 띄웁니다.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !listRef.current) return;
    const triggerRect = triggerRef.current.getBoundingClientRect();
    const listHeight = listRef.current.getBoundingClientRect().height;
    const spaceBelow = window.innerHeight - triggerRect.bottom;
    setPlacement(spaceBelow < listHeight && triggerRect.top > listHeight ? 'top' : 'bottom');
  }, [open]);

  useEffect(
    () => () => {
      if (typeaheadRef.current.timer) clearTimeout(typeaheadRef.current.timer);
    },
    [],
  );

  const onTypeahead = (key: string) => {
    const state = typeaheadRef.current;
    if (state.timer) clearTimeout(state.timer);
    state.buffer += key;
    state.timer = setTimeout(() => {
      state.buffer = '';
      state.timer = null;
    }, TYPEAHEAD_RESET_MS);
    const match = typeaheadIndex(labels, state.buffer, activeIndex ?? -1);
    if (match !== null) setActiveIndex(match);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((current) => wrapIndex(current ?? -1, options.length, 1) ?? current);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        openList();
        return;
      }
      setActiveIndex((current) => wrapIndex(current ?? 0, options.length, -1) ?? current);
      return;
    }

    // 나머지 키는 목록이 열려 있을 때만 뜻이 있습니다. 닫혀 있으면 단추의 기본 동작(스페이스,
    // 엔터로 클릭)에 맡겨 열립니다.
    if (!open) return;

    if (event.key === 'Home') {
      event.preventDefault();
      setActiveIndex(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      setActiveIndex(options.length - 1);
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (activeIndex !== null) commit(activeIndex);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key === 'Tab') {
      close();
    } else if (event.key.length === 1 && !event.altKey && !event.ctrlKey && !event.metaKey) {
      onTypeahead(event.key);
    }
  };

  const triggerContent = selectedOption
    ? renderOption
      ? renderOption(selectedOption)
      : selectedOption.label
    : '';

  return (
    <div className="hs-listbox" ref={rootRef} data-disabled={disabled}>
      <button
        type="button"
        id={id}
        ref={triggerRef}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex !== null ? optionId(activeIndex) : undefined}
        aria-label={label}
        disabled={disabled}
        className="hs-listbox-trigger"
        onClick={() => (open ? close() : openList())}
        onKeyDown={onKeyDown}
      >
        <span className="hs-listbox-value">{triggerContent}</span>
        <ChevronDown aria-hidden="true" size={16} className="hs-listbox-caret" />
      </button>
      <ul
        id={listboxId}
        role="listbox"
        aria-label={label}
        ref={listRef}
        className="hs-listbox-list"
        data-placement={placement}
        hidden={!open}
      >
        {options.map((option, index) => (
          <li
            key={option.value}
            id={optionId(index)}
            role="option"
            aria-selected={option.value === value}
            data-selected={option.value === value}
            data-active={index === activeIndex}
            className="hs-listbox-option"
            onMouseEnter={() => setActiveIndex(index)}
            onClick={() => commit(index)}
          >
            {renderOption ? renderOption(option) : option.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
