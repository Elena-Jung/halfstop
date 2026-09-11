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

/**
 * 미리보기 대상은 마지막에 누른 사진(active)입니다. 그 사진이 고른 것 안에 있으면 그것을
 * 돌려주므로 썸네일을 누를 때마다 예외 없이 그 사진이 화면에 뜹니다.
 *
 * 예전에는 고른 것 중 가장 앞선 인덱스였습니다. 규칙 자체는 한결같았지만 누른 사진이
 * 앞선 인덱스가 될 때만 화면이 움직여, 셋째 장을 누르면 가만히 있고 첫째 장을 누르면
 * 화면이 튀었습니다. 사용자가 이것을 썸네일이 작아서 어떤 때는 체크만 되는 것으로
 * 읽었습니다.
 *
 * active 가 고른 것 밖이면(활성인 사진의 선택을 방금 푼 경우) 예전 규칙인 가장 앞선
 * 인덱스로 떨어집니다. 고른 것이 없으면 null 입니다.
 */
export function previewIndex(
  selected: ReadonlySet<number>,
  active: number | null,
): number | null {
  if (active !== null && selected.has(active)) return active;
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

/**
 * remove 에 담긴 인덱스를 목록에서 뺍니다. 뺀 항목은 removed 로 따로 돌려주어 호출자가
 * 그 항목이 들고 있던 자원(디코딩된 비트맵, 썸네일 객체 URL)을 회수할 수 있게 합니다.
 * remove 에 범위 밖 인덱스가 섞여 있어도 무시할 뿐 던지지 않습니다.
 */
export function removeAt<T>(
  items: readonly T[],
  remove: ReadonlySet<number>,
): { kept: readonly T[]; removed: readonly T[] } {
  const kept: T[] = [];
  const removed: T[] = [];
  items.forEach((item, index) => {
    if (remove.has(index)) removed.push(item);
    else kept.push(item);
  });
  return { kept, removed };
}

/**
 * removed 에 담긴 인덱스가 목록에서 빠지면 그 뒤에 있던 항목의 인덱스가 앞으로
 * 당겨집니다. selected 에 남아 있던 인덱스를 당겨진 만큼 옮겨 새 목록 기준으로 다시
 * 셉니다. removed 에 든 인덱스 자체는 그 항목이 사라졌으므로 결과에서 빠집니다.
 * total 은 removed 를 적용하기 전 전체 길이이고, 그 범위를 벗어난 selected 의
 * 인덱스는 무시합니다.
 */
export function reindexSelection(
  selected: ReadonlySet<number>,
  removed: ReadonlySet<number>,
  total: number,
): ReadonlySet<number> {
  const next = new Set<number>();
  for (const index of selected) {
    if (index < 0 || index >= total || removed.has(index)) continue;
    let shift = 0;
    for (const removedIndex of removed) {
      if (removedIndex < index) shift += 1;
    }
    next.add(index - shift);
  }
  return next;
}

/**
 * 활성 인덱스에도 reindexSelection 과 똑같은 당김을 적용합니다. 선택 집합만 다시 세고
 * 활성 인덱스를 그대로 두면 삭제 뒤에 엉뚱한 사진이 미리보기에 뜹니다.
 *
 * 활성인 사진 자체가 지워졌으면 null 이고, 그러면 previewIndex 가 남은 고른 것 중 가장
 * 앞선 것으로 떨어집니다.
 */
export function reindexActive(
  active: number | null,
  removed: ReadonlySet<number>,
  total: number,
): number | null {
  if (active === null) return null;
  for (const index of reindexSelection(new Set([active]), removed, total)) return index;
  return null;
}
