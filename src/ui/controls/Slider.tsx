import type { CSSProperties } from 'react';

/**
 * `input[type=range]` 를 그대로 씁니다. 네이티브 range 의 키보드 동작(화살표, Home/End,
 * PageUp/PageDown)이 이미 완전해서 대체할 이유가 없습니다. 트랙과 손잡이만 우리 색으로
 * 다시 그리고, 지금 값을 옆에 숫자로 보입니다.
 */
export function Slider(props: {
  id?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const { id, value, min, max, step, unit, disabled = false, onChange } = props;

  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  // 채워진 구간을 CSS 로 넘겨 ::-webkit-slider-runnable-track 에서 읽습니다.
  const style = { '--hs-slider-percent': `${percent}%` } as CSSProperties;

  return (
    <div className="hs-slider" data-disabled={disabled}>
      <input
        id={id}
        type="range"
        className="hs-slider-input"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(Number(event.target.value))}
        style={style}
      />
      <span className="hs-slider-value" aria-hidden="true">
        {value}
        {unit}
      </span>
    </div>
  );
}
