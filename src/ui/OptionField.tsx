import { useEffect } from 'react';
import { fontUrl } from '../assets/fontUrls';
import type { OptionValue, PresetOption } from '../core/layout/options';
import { CANVAS_FONTS, fontById, fontStack } from '../core/paint/fontFamilies';
import { ensureCanvasFontOnce, type FontFaceSetLike } from '../core/paint/fonts';
import { ko, t, type MessageKey } from '../i18n';
import { Checkbox } from './controls/Checkbox';
import { ColorPicker } from './controls/ColorPicker';
import { Listbox, type ListboxOption } from './controls/Listbox';
import { NumberField } from './controls/NumberField';
import { Slider } from './controls/Slider';
import { TextField } from './controls/TextField';

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

/**
 * 서체 목록의 각 이름을 그 서체로 보입니다. 기본 select 로는 못 하던 일이고, Listbox 를
 * 직접 만든 실질적 값어치입니다. usePipeline 은 지금 고른 서체 하나만 등록하므로,
 * 나머지 서체는 아무도 부르지 않으면 이름이 대체 계열로만 보입니다. 이 목록이 화면에
 * 뜨는 동안 네 서체 등록을 모두 시작해 둡니다. ensureCanvasFontOnce 가 서체별로 등록을
 * 한 번만 하도록 이미 막아 두어, usePipeline 이 부른 것과 겹쳐도 두 번 받지 않습니다.
 * 등록이 실패해도 이름은 대체 계열로 보일 뿐이라 오류는 무시합니다.
 */
function FontFamilyField(props: {
  id: string;
  label: string;
  value: string;
  options: readonly ListboxOption[];
  disabled: boolean;
  onChange: (value: string) => void;
}) {
  const { id, label, value, options, disabled, onChange } = props;

  useEffect(() => {
    for (const font of CANVAS_FONTS) {
      void ensureCanvasFontOnce(document.fonts as unknown as FontFaceSetLike, font, fontUrl(font.id)).catch(
        () => undefined,
      );
    }
  }, []);

  return (
    <Listbox
      id={id}
      label={label}
      value={value}
      options={options}
      disabled={disabled}
      onChange={onChange}
      renderOption={(option) => (
        <span style={{ fontFamily: fontStack(fontById(option.value)) }}>{option.label}</span>
      )}
    />
  );
}

export function OptionField(props: {
  option: PresetOption;
  value: OptionValue;
  disabled: boolean;
  onChange: (value: OptionValue) => void;
  /** BACKGROUND 와 TEXT_COLOR 처럼 서로의 대비를 보여야 뜻이 있는 짝의 상대 색입니다. */
  contrastAgainst?: string;
}) {
  const { option, value, disabled, onChange, contrastAgainst } = props;

  const fieldId = `option-${option.id}`;
  const label = t(option.labelKey as MessageKey);

  const field = () => {
    switch (option.type) {
      case 'color': {
        // exactOptionalPropertyTypes 라 contrastAgainst 에 undefined 를 명시적으로
        // 넘길 수 없습니다. 값이 있을 때만 속성 자체를 붙입니다.
        const contrastProps = contrastAgainst !== undefined ? { contrastAgainst } : {};
        return (
          <ColorPicker
            id={fieldId}
            label={label}
            value={String(value)}
            disabled={disabled}
            onChange={onChange}
            {...contrastProps}
          />
        );
      }
      case 'boolean':
        return (
          <Checkbox id={fieldId} checked={Boolean(value)} disabled={disabled} onChange={onChange} />
        );
      case 'number':
        return (
          <NumberField
            id={fieldId}
            label={label}
            value={Number(value)}
            min={option.min}
            max={option.max}
            unit={option.unit}
            disabled={disabled}
            onChange={onChange}
          />
        );
      case 'range':
        return (
          <Slider
            id={fieldId}
            value={Number(value)}
            min={option.min}
            max={option.max}
            step={option.step}
            disabled={disabled}
            onChange={onChange}
          />
        );
      case 'select': {
        const choices: ListboxOption[] = option.options.map((choice) => ({
          value: choice,
          label: optionLabel(option.id, choice),
        }));
        if (option.id === 'FONT_FAMILY') {
          return (
            <FontFamilyField
              id={fieldId}
              label={label}
              value={String(value)}
              options={choices}
              disabled={disabled}
              onChange={onChange}
            />
          );
        }
        return (
          <Listbox
            id={fieldId}
            label={label}
            value={String(value)}
            options={choices}
            disabled={disabled}
            onChange={onChange}
          />
        );
      }
      case 'text':
        return <TextField id={fieldId} value={String(value)} onChange={onChange} disabled={disabled} />;
    }
  };

  return (
    <div className="hs-field">
      <label htmlFor={fieldId}>{label}</label>
      {field()}
    </div>
  );
}
