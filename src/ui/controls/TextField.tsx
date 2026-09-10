/**
 * `input[type=text]` 를 대체합니다. 값 자체는 브라우저 기본 동작 그대로 두고 테두리와
 * 배경만 우리 색 토큰으로 맞춥니다.
 */
export function TextField(props: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  const { id, value, onChange, disabled = false, placeholder } = props;

  return (
    <input
      id={id}
      type="text"
      className="hs-text-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
}
