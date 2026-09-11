import { Minus, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { t } from '../../i18n';
import {
  displayBounds,
  displayStep,
  displayValue,
  storedValue,
  type UnitMode,
} from '../unitScale';

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
  /** 지금 값을 보여 주고 받는 단위입니다. 모든 숫자 칸이 하나를 함께 씁니다. */
  unitMode?: UnitMode;
  /** 1u 가 내보낼 파일에서 몇 픽셀인지입니다. 환산할 수 없으면 null 입니다. */
  pxPerUnit?: number | null;
  onToggleUnit?: () => void;
}) {
  const {
    id,
    label,
    value,
    min,
    max,
    step = 1,
    unit,
    disabled = false,
    onChange,
    unitMode = 'u',
    pxPerUnit = null,
    onToggleUnit,
  } = props;

  // 단위를 바꿀 수 있는 것은 디자인 단위 칸뿐이고, 사진의 원본 크기를 알아야 환산이
  // 됩니다. 둘 중 하나라도 아니면 지금까지처럼 글자만 보입니다. 환산할 수 없는데 단추만
  // 있으면 눌렀을 때 엉뚱한 숫자가 나옵니다.
  const switchable = unit === 'u' && pxPerUnit !== null && onToggleUnit !== undefined;
  const mode: UnitMode = switchable ? unitMode : 'u';
  const scale = switchable ? pxPerUnit : null;
  const shown = displayValue(value, mode, scale);
  const bounds = displayBounds(min, max, mode, scale);
  const shownStep = displayStep(step, mode);

  const clamp = (raw: number) => Math.min(bounds.max, Math.max(bounds.min, raw));

  // 증감 단추를 한 틱 안에 두 번 누르면 두 번째가 낡은 value 를 읽어 한 단계를 잃습니다.
  // 부모의 상태 갱신이 비동기라서 그렇습니다. 마지막 값을 ref 에 동기적으로 써 두고 거기서
  // 계산하면 연달아 누른 만큼 쌓입니다. 부모가 다른 값을 돌려주면 아래 효과가 다시 맞춥니다.
  // 화면에 보이는 단위로 셈합니다. 저장은 언제나 u 이므로 부모에 넘기기 직전에 되돌립니다.
  const latest = useRef(shown);
  useEffect(() => {
    latest.current = shown;
  }, [shown]);

  const bump = (direction: 1 | -1) => {
    const next = clamp(latest.current + direction * shownStep);
    latest.current = next;
    onChange(storedValue(next, mode, scale));
  };

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
        min={bounds.min}
        max={bounds.max}
        step={shownStep}
        value={shown}
        disabled={disabled}
        onChange={(event) => {
          const next = event.target.valueAsNumber;
          if (!Number.isNaN(next)) onChange(storedValue(clamp(next), mode, scale));
        }}
      />
      {switchable ? (
        <button
          type="button"
          className="hs-number-unit hs-number-unit-button"
          aria-label={t(mode === 'u' ? 'unit.toPx' : 'unit.toUnits')}
          title={t('unit.explain')}
          onClick={onToggleUnit}
          disabled={disabled}
        >
          {mode === 'u' ? 'u' : 'px'}
        </button>
      ) : (
        unit && <span className="hs-number-unit">{unit}</span>
      )}
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
