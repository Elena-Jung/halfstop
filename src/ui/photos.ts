/**
 * 사진 목록을 다루는 순수 함수입니다. React 도 DOM 도 참조하지 않아 usePipeline 에서
 * 상태를 계산하는 자리와 여기 있는 검증을 나눌 수 있습니다.
 */

/**
 * 미리보기 비트맵 하나가 긴 변 1600 기준 1600x1067x4 = 약 6.5MB 이므로 24장이면 약
 * 156MB 입니다.
 *
 * **이 메모리는 JS 힙이 아닙니다.** 브라우저에서 비트맵 열두 개를 만들어 놓고 재 보니
 * `usedJSHeapSize` 가 27MB 에서 26MB 로 꿈쩍도 하지 않았습니다. `ImageBitmap` 은 힙
 * 밖에 있어서 힙 한도(잰 브라우저에서 4192MB)와 무관합니다. 처음에 12로 잡았던 것은
 * 이 사실을 모르고 힙 예산처럼 셈한 탓이라 지나치게 보수적이었습니다.
 *
 * 24는 데스크톱에 여유가 많고 요즘 휴대폰도 감당하는 선입니다. 더 올릴 때는 메모리보다
 * 불러오는 시간을 보십시오. 상한이 커지면 한 번에 디코딩할 파일이 늘어 오래된 기기에서
 * 기다리는 시간이 길어집니다.
 */
export const MAX_PHOTOS = 24;

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
