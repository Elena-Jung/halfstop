import type { OptionValue, PresetOption } from '../core/layout/options';
import { fontById } from '../core/paint/fontFamilies';
import { ko, t, type MessageKey } from '../i18n';

/**
 * select 선택지의 이름표를 사람이 읽는 말로 바꿉니다. MODE 와 ALIGN 은 사전에 값
 * 이름표가 있고, FONT_FAMILY 는 서체 이름을 보여줍니다. 그 밖의 select 는 값을
 * 그대로 씁니다. 사전에 없는 키를 t() 에 넘기지 않도록 먼저 존재를 확인합니다.
 */
function optionLabel(optionId: string, value: string): string {
  if (optionId === 'FONT_FAMILY') return fontById(value).label;
  if (optionId === 'MODE' || optionId === 'ALIGN') {
    const key = `value.${optionId}.${value}`;
    if (Object.hasOwn(ko, key)) return t(key as MessageKey);
  }
  return value;
}

export function OptionField(props: {
  option: PresetOption;
  value: OptionValue;
  disabled: boolean;
  onChange: (value: OptionValue) => void;
}) {
  const { option, value, disabled, onChange } = props;

  const field = () => {
    switch (option.type) {
      case 'color':
        return (
          <input
            type="color"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={Boolean(value)}
            onChange={(e) => onChange(e.target.checked)}
            disabled={disabled}
          />
        );
      case 'number':
        return (
          <input
            type="number"
            min={option.min}
            max={option.max}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
          />
        );
      case 'range':
        return (
          <input
            type="range"
            min={option.min}
            max={option.max}
            step={option.step}
            value={Number(value)}
            onChange={(e) => onChange(Number(e.target.value))}
            disabled={disabled}
          />
        );
      case 'select':
        return (
          <select
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            {option.options.map((choice) => (
              <option key={choice} value={choice}>
                {optionLabel(option.id, choice)}
              </option>
            ))}
          </select>
        );
      case 'text':
        return (
          <input
            type="text"
            value={String(value)}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        );
    }
  };

  return (
    <label className="hs-field">
      <span>{t(option.labelKey as MessageKey)}</span>
      {field()}
    </label>
  );
}
