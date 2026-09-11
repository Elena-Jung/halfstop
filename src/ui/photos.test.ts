import { describe, expect, it } from 'vitest';
import {
  applyToSelected,
  capItems,
  MAX_PHOTOS,
  previewIndex,
  reindexSelection,
  removeAt,
  toggleSelectAll,
} from './photos';

describe('capItems', () => {
  it('상한 밑이면 전부 받고 초과분이 0입니다', () => {
    const result = capItems([10, 11, 12, 13, 14], 12);
    expect(result.kept).toEqual([10, 11, 12, 13, 14]);
    expect(result.overflow).toBe(0);
  });

  it('상한을 넘으면 앞에서부터 상한만큼만 받습니다', () => {
    const items = Array.from({ length: 15 }, (_, i) => i);
    const result = capItems(items, 12);
    expect(result.kept).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    expect(result.overflow).toBe(3);
  });

  it('기본 상한은 24장입니다', () => {
    expect(MAX_PHOTOS).toBe(24);
  });
});

describe('previewIndex', () => {
  it('아무것도 안 골랐으면 null 입니다', () => {
    expect(previewIndex(new Set())).toBeNull();
  });

  it('고른 것 중 가장 작은 인덱스를 돌려줍니다', () => {
    expect(previewIndex(new Set([3, 1, 4]))).toBe(1);
  });

  it('하나만 골랐으면 그 인덱스입니다', () => {
    expect(previewIndex(new Set([5]))).toBe(5);
  });
});

describe('toggleSelectAll', () => {
  it('전부 골라져 있으면 전부 풉니다', () => {
    const result = toggleSelectAll(4, new Set([0, 1, 2, 3]));
    expect(result).toEqual(new Set());
  });

  it('일부만 골라져 있으면 전부 고릅니다', () => {
    const result = toggleSelectAll(4, new Set([0, 2]));
    expect(result).toEqual(new Set([0, 1, 2, 3]));
  });

  it('아무것도 안 골랐으면 전부 고릅니다', () => {
    const result = toggleSelectAll(3, new Set());
    expect(result).toEqual(new Set([0, 1, 2]));
  });

  it('사진이 없으면 빈 채로 둡니다', () => {
    const result = toggleSelectAll(0, new Set());
    expect(result).toEqual(new Set());
  });
});

describe('applyToSelected', () => {
  it('고른 인덱스에만 바뀐 값을 넣고 나머지는 그대로 둡니다', () => {
    const items = ['a', 'b', 'c', 'd'];
    const result = applyToSelected(items, new Set([1, 3]), (item) => item.toUpperCase());
    expect(result).toEqual(['a', 'B', 'c', 'D']);
  });

  it('아무것도 안 골랐으면 원래 값을 그대로 돌려줍니다', () => {
    const items = ['a', 'b'];
    const result = applyToSelected(items, new Set(), (item) => item.toUpperCase());
    expect(result).toEqual(['a', 'b']);
  });
});

describe('removeAt', () => {
  it('아무것도 안 빼면 전부 kept 로 남고 removed 는 빕니다', () => {
    const result = removeAt(['a', 'b', 'c'], new Set());
    expect(result.kept).toEqual(['a', 'b', 'c']);
    expect(result.removed).toEqual([]);
  });

  it('가운데를 빼면 그 항목만 removed 로 가고 나머지는 순서를 지킨 채 남습니다', () => {
    const result = removeAt(['a', 'b', 'c', 'd'], new Set([1, 2]));
    expect(result.kept).toEqual(['a', 'd']);
    expect(result.removed).toEqual(['b', 'c']);
  });

  it('고른 것을 전부 빼면 kept 가 비고 removed 에 전부 담깁니다', () => {
    const result = removeAt(['a', 'b'], new Set([0, 1]));
    expect(result.kept).toEqual([]);
    expect(result.removed).toEqual(['a', 'b']);
  });

  it('범위 밖 인덱스를 넘겨도 던지지 않고 무시합니다', () => {
    const result = removeAt(['a', 'b'], new Set([5, -1]));
    expect(result.kept).toEqual(['a', 'b']);
    expect(result.removed).toEqual([]);
  });
});

describe('reindexSelection', () => {
  it('가운데를 빼면 뒤쪽 선택 인덱스가 앞으로 당겨집니다', () => {
    // 전체 6개 중 2, 3 을 빼면 뒤에 있던 4, 5 는 2, 3 으로 당겨집니다.
    const result = reindexSelection(new Set([0, 4, 5]), new Set([2, 3]), 6);
    expect(result).toEqual(new Set([0, 2, 3]));
  });

  it('고른 것을 전부 빼면 선택 집합이 빕니다', () => {
    const result = reindexSelection(new Set([1, 2]), new Set([1, 2]), 4);
    expect(result).toEqual(new Set());
  });

  it('아무것도 안 골랐으면 무엇을 빼도 그대로 빈 채입니다', () => {
    const result = reindexSelection(new Set(), new Set([0]), 3);
    expect(result).toEqual(new Set());
  });

  it('범위 밖 인덱스를 넘겨도 던지지 않고 무시합니다', () => {
    const result = reindexSelection(new Set([10, -1, 1]), new Set([0]), 3);
    expect(result).toEqual(new Set([0]));
  });
});
