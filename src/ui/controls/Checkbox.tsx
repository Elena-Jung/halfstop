/**
 * boolean 옵션을 그리는 컨트롤입니다. PhotoStrip 의 체크박스와 같은 시각 언어를
 * 씁니다. 실제 체크박스(.hs-radio-input)는 화면에서만 감추고 옆의 .hs-radio-box 가
 * 표시자 역할을 합니다. 사용자가 두 가지 고르는 방식을 따로 배우지 않아도 됩니다.
 *
 * .hs-radio-box 는 [data-selected='true'] 를 가진 조상이 있어야 채워진 모습으로
 * 바뀝니다(preset-item, photo-item 이 쓰는 것과 같은 규칙). 감싸는 span 이 그 조상
 * 역할을 합니다.
 */
export function Checkbox(props: {
  id: string;
  checked: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}) {
  const { id, checked, disabled, onChange } = props;

  return (
    <span className="hs-checkbox" data-selected={checked}>
      <input
        id={id}
        type="checkbox"
        className="hs-radio-input"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span className="hs-radio-box" aria-hidden="true" />
    </span>
  );
}
