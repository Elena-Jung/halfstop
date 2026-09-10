/**
 * Listbox 의 순수 로직만 모았습니다. `role="combobox"` 트리거에 초점을 두고
 * `aria-activedescendant` 로 목록 항목을 가리키는 방식이라, 어느 항목이 "지금 가리키는
 * 항목"인지 정하는 계산이 화면 그리기와 분리됩니다. 화면 렌더 테스트를 만들 수 없는
 * 환경이라 이 계산들이 Listbox 의 유일한 자동 검사입니다.
 */

/**
 * 화살표로 다음/이전 항목의 인덱스를 구합니다. 끝에서 감깁니다. 목록이 비어 있으면(count
 * 가 0이면) 옮길 곳이 없으므로 null 을 돌려줍니다.
 */
export function wrapIndex(current: number, count: number, delta: number): number | null {
  if (count <= 0) return null;
  return (((current + delta) % count) + count) % count;
}

/**
 * 목록을 열 때 가리킬 항목의 인덱스를 정합니다. 지금 값이 목록에 있으면 그 항목을,
 * 없으면(저장된 값이 지금 선언과 어긋나는 경우) 첫 항목을 가리킵니다. 목록이 비어 있으면
 * 가리킬 것이 없으므로 null 입니다.
 */
export function initialActiveIndex<T>(values: readonly T[], current: T): number | null {
  if (values.length === 0) return null;
  const index = values.indexOf(current);
  return index === -1 ? 0 : index;
}

/**
 * 글자를 눌러 항목을 찾아가는 규칙입니다. 지금 가리키는 항목의 다음부터 찾아 끝에서
 * 감기므로(현재 항목 자신도 마지막으로 한 번 더 검사합니다), 같은 문자를 이미 앞서 찾은
 * 뒤에도 계속 눌러 찾을 수 있습니다.
 *
 * 같은 글자만 반복해 누르면(예: "b" 세 번) 그 글자로 시작하는 항목들을 하나씩 순환하는
 * 것이 관례입니다. buffer 전체가 한 글자의 반복이면 그 한 글자만 찾아 쓰고, 그렇지 않으면
 * (예: "in") buffer 전체를 앞부분으로 삼아 찾습니다.
 *
 * 찾는 문자열로 시작하는 항목이 하나도 없으면 null 입니다.
 */
export function typeaheadIndex(
  labels: readonly string[],
  buffer: string,
  activeIndex: number,
): number | null {
  if (labels.length === 0 || buffer.length === 0) return null;
  const repeatedSingleChar = buffer.length > 1 && [...buffer].every((c) => c === buffer[0]);
  const query = (repeatedSingleChar ? buffer[0]! : buffer).toLowerCase();
  for (let step = 1; step <= labels.length; step += 1) {
    const index = (activeIndex + step) % labels.length;
    if (labels[index]!.toLowerCase().startsWith(query)) return index;
  }
  return null;
}
