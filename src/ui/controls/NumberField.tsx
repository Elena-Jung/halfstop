import { Minus, Plus } from 'lucide-react';
import { t } from '../../i18n';

/**
 * `input[type=number]` 를 대체합니다. 네이티브 입력은 그대로 두고 브라우저 스피너만
 * `appearance: none` 과 `::-webkit-inner-spin-button` 으로 지운 뒤 우리 증감 단추를
 * 붙입니다. 값이 범위를 벗어나도 단추를 비활성화하지 않습니다. 초점이 있는 단추가
 * 비활성화되면 브라우저가 초점을 말없이 문서로 되돌려 버려 키보드 이동 순서가 끊기기
 * 때문입니다. 대신 늘리고 줄이는 계산 자체를 min/max 로 조입니다.
 */
export function NumberField(props: {
  id?: string;
  /** 증감 단추의 aria-label 에 쓸, 이미 번역된 필드 이름입니다. */
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  const { id, label, value, min, max, step = 1, unit, disabled = false, onChange } = props;

  const clamp = (raw: number) => Math.min(max, Math.max(min, raw));
  const bump = (direction: 1 | -1) => onChange(clamp(value + direction * step));

  return (
    <div className="hs-number" data-disabled={disabled}>
      <button
        type="button"
        className="hs-number-btn"
        aria-label={t('control.decrease', { label })}
        onClick={() => bump(-1)}
        disabled={disabled}
      >
        <Minus aria-hidden="true" size={14} />
      </button>
      <input
        id={id}
        type="number"
        className="hs-number-input"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (!Number.isNaN(next)) onChange(clamp(next));
        }}
      />
      {unit && <span className="hs-number-unit">{unit}</span>}
      <button
        type="button"
        className="hs-number-btn"
        aria-label={t('control.increase', { label })}
        onClick={() => bump(1)}
        disabled={disabled}
      >
        <Plus aria-hidden="true" size={14} />
      </button>
    </div>
  );
}
