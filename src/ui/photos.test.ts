import { describe, expect, it } from 'vitest';
import { applyToSelected, capItems, MAX_PHOTOS, previewIndex, toggleSelectAll } from './photos';

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

  it('기본 상한은 12장입니다', () => {
    expect(MAX_PHOTOS).toBe(12);
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
