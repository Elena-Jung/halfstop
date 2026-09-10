/**
 * 사진 목록을 다루는 순수 함수입니다. React 도 DOM 도 참조하지 않아 usePipeline 에서
 * 상태를 계산하는 자리와 여기 있는 검증을 나눌 수 있습니다.
 */

/**
 * 디코딩된 미리보기 하나가 긴 변 1600 기준 약 7MB 라 12장이면 약 84MB 입니다. 지시서가
 * 정한 상한입니다.
 */
export const MAX_PHOTOS = 12;

/** 넘겨받은 목록을 상한만큼 앞에서 자릅니다. 넘긴 개수를 overflow 로 함께 돌려줍니다. */
export function capItems<T>(items: readonly T[], max: number = MAX_PHOTOS): {
  kept: readonly T[];
  overflow: number;
} {
  return { kept: items.slice(0, max), overflow: Math.max(0, items.length - max) };
}

/** 미리보기 대상은 고른 것 중 목록 순서로 가장 앞선 인덱스입니다. 아무것도 안 골랐으면 null 입니다. */
export function previewIndex(selected: ReadonlySet<number>): number | null {
  let min: number | null = null;
  for (const index of selected) {
    if (min === null || index < min) min = index;
  }
  return min;
}

/**
 * 전체 선택 단추가 누를 때마다 하는 일입니다. 이미 전부 골라져 있으면 전부 풀고,
 * 아니면(하나도 없거나 일부만 골랐으면) 전부 고릅니다.
 */
export function toggleSelectAll(count: number, selected: ReadonlySet<number>): Set<number> {
  let allSelected = count > 0 && selected.size === count;
  if (allSelected) {
    for (let i = 0; i < count; i++) {
      if (!selected.has(i)) {
        allSelected = false;
        break;
      }
    }
  }
  if (allSelected) return new Set();
  const next = new Set<number>();
  for (let i = 0; i < count; i++) next.add(i);
  return next;
}

/** 고른 인덱스의 항목에만 update 를 적용합니다. 안 고른 항목은 참조까지 그대로 둡니다. */
export function applyToSelected<T>(
  items: readonly T[],
  selected: ReadonlySet<number>,
  update: (item: T) => T,
): T[] {
  return items.map((item, index) => (selected.has(index) ? update(item) : item));
}
