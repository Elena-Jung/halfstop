import { describe, expect, it } from 'vitest';
import { ellipsize } from './primitives';
import type { LayoutServices, TextStyle } from './types';

const STYLE: TextStyle = {
  family: 'Test',
  size: 10,
  weight: 400,
  style: 'normal',
  color: '#000000',
  align: 'left',
  baseline: 'middle',
  alpha: 1,
};

/** 글자 하나를 폭 10으로 세는 가짜 측정기입니다. 결정적이라 테스트에 적합합니다. */
const services: LayoutServices = {
  measureText: (text) => text.length * 10,
  hasLogo: () => false,
};

describe('ellipsize', () => {
  it('폭이 남으면 그대로 둡니다', () => {
    expect(ellipsize('abc', 100, STYLE, services)).toBe('abc');
  });

  it('딱 맞으면 그대로 둡니다', () => {
    expect(ellipsize('abc', 30, STYLE, services)).toBe('abc');
  });

  it('넘치면 말줄임표를 붙입니다', () => {
    // 말줄임표가 폭 10을 먹으므로 40 안에는 글자 3개가 들어갑니다.
    expect(ellipsize('abcdef', 40, STYLE, services)).toBe('abc…');
  });

  it('말줄임표조차 못 넣을 폭이면 빈 문자열입니다', () => {
    expect(ellipsize('abcdef', 5, STYLE, services)).toBe('');
  });

  it('빈 문자열은 빈 문자열입니다', () => {
    expect(ellipsize('', 100, STYLE, services)).toBe('');
  });

  it('폭이 0 이하면 빈 문자열입니다', () => {
    expect(ellipsize('abc', 0, STYLE, services)).toBe('');
  });
});
