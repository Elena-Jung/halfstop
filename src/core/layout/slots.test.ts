import { describe, expect, it } from 'vitest';
import { resolveSlot } from './slots';
import type { OptionValue } from './types';

const FIELDS = { MAKER: 'Canon', BODY: 'EOS R6', MM: '50mm', F: 'f/2.8' } as const;

function opts(entries: Record<string, OptionValue>): Map<string, OptionValue> {
  return new Map(Object.entries(entries));
}

describe('resolveSlot', () => {
  it('주 줄과 부 줄을 각각 해석합니다', () => {
    const values = opts({ PRIMARY_MAIN: '{MAKER}{BODY}', PRIMARY_SUB: '{MM}{F}' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '·')).toEqual({
      main: 'Canon · EOS R6',
      sub: '50mm · f/2.8',
    });
  });

  it('부 줄이 비면 빈 문자열입니다', () => {
    const values = opts({ PRIMARY_MAIN: '{MAKER}', PRIMARY_SUB: '' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '·')).toEqual({ main: 'Canon', sub: '' });
  });

  it('값이 없는 토큰만 있으면 그 줄이 빕니다', () => {
    const values = opts({ PRIMARY_MAIN: '{LENS}', PRIMARY_SUB: '{ISO}' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '·')).toEqual({ main: '', sub: '' });
  });

  it('SECONDARY 슬롯도 같은 방식으로 읽습니다', () => {
    const values = opts({ SECONDARY_MAIN: '{MM}', SECONDARY_SUB: '{F}' });
    expect(resolveSlot(values, 'SECONDARY', FIELDS, '·')).toEqual({ main: '50mm', sub: 'f/2.8' });
  });

  it('옵션 키가 아예 없으면 빈 줄로 봅니다', () => {
    expect(resolveSlot(opts({}), 'PRIMARY', FIELDS, '·')).toEqual({ main: '', sub: '' });
  });

  it('구분자를 그대로 전달합니다', () => {
    const values = opts({ PRIMARY_MAIN: '{MAKER}{BODY}', PRIMARY_SUB: '' });
    expect(resolveSlot(values, 'PRIMARY', FIELDS, '|').main).toBe('Canon | EOS R6');
  });
});
