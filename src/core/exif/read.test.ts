import { describe, expect, it } from 'vitest';
import { integer, rational } from './read';

describe('rational', () => {
  it('숫자 값은 그대로 돌려줍니다', () => {
    expect(rational({ value: 0.004 })).toBe(0.004);
  });

  it('[분자, 분모] 배열은 나눈 값을 돌려줍니다', () => {
    expect(rational({ value: [1, 250] })).toBe(0.004);
  });

  it('분모가 0이면 undefined입니다. 분자를 반환하면 안 됩니다', () => {
    expect(rational({ value: [1, 0] })).toBeUndefined();
  });

  it('[0, 0]은 값이 없는 것으로 봅니다', () => {
    expect(rational({ value: [0, 0] })).toBeUndefined();
  });

  it('길이가 2가 아닌 배열은 undefined입니다', () => {
    expect(rational({ value: [100, 200, 300] })).toBeUndefined();
  });

  it('태그가 없으면 undefined입니다', () => {
    expect(rational(undefined)).toBeUndefined();
  });
});

describe('integer', () => {
  it('숫자 값은 그대로 돌려줍니다', () => {
    expect(integer({ value: 400 })).toBe(400);
  });

  it('배열이면 나누지 않고 첫 값을 돌려줍니다', () => {
    expect(integer({ value: [400, 800] })).toBe(400);
  });

  it('숫자가 아니면 undefined입니다', () => {
    expect(integer({ value: 'ISO 400' })).toBeUndefined();
  });

  it('태그가 없으면 undefined입니다', () => {
    expect(integer(undefined)).toBeUndefined();
  });
});
