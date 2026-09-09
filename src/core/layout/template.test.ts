import { describe, expect, it } from 'vitest';
import { renderTemplate } from './template';

const FULL = {
  MAKER: 'Nikon',
  BODY: 'Z 6II',
  LENS: 'NIKKOR Z 35mm f/1.8 S',
  MM: '35mm',
  F: 'f/1.8',
  SEC: '1/250s',
  ISO: 'ISO 400',
  TAKEN_AT: '2026-09-09',
} as const;

describe('renderTemplate', () => {
  it('토큰만 늘어놓으면 구분자로 잇습니다', () => {
    expect(renderTemplate('{MAKER}{BODY}{ISO}', FULL, '·')).toBe('Nikon · Z 6II · ISO 400');
  });

  it('값이 없는 토큰은 구분자까지 함께 사라집니다', () => {
    expect(renderTemplate('{MAKER}{LENS}{ISO}', { MAKER: 'Nikon', ISO: 'ISO 400' }, '·')).toBe(
      'Nikon · ISO 400',
    );
  });

  it('빈 문자열도 값이 없는 것으로 봅니다', () => {
    expect(renderTemplate('{MAKER}{BODY}', { MAKER: 'Nikon', BODY: '   ' }, '·')).toBe('Nikon');
  });

  it('토큰 앞 리터럴은 그 토큰과 운명을 함께합니다', () => {
    expect(renderTemplate('shot on {BODY}', FULL, '·')).toBe('shot on Z 6II');
    expect(renderTemplate('shot on {BODY}', {}, '·')).toBe('');
  });

  it('마지막 토큰 뒤 리터럴은 따로 살아남습니다', () => {
    expect(renderTemplate('{MAKER} 로 촬영', FULL, '·')).toBe('Nikon · 로 촬영');
  });

  it('모르는 토큰은 값이 없는 것으로 봅니다', () => {
    expect(renderTemplate('{MAKER}{GPS}', FULL, '·')).toBe('Nikon');
  });

  it('토큰이 하나도 없으면 리터럴만 남습니다', () => {
    expect(renderTemplate('halfstop', FULL, '·')).toBe('halfstop');
  });

  it('모든 값이 비면 빈 문자열입니다', () => {
    expect(renderTemplate('{MAKER}{BODY}', {}, '·')).toBe('');
  });

  it('구분자가 비면 공백 하나로 잇습니다', () => {
    expect(renderTemplate('{MAKER}{BODY}', FULL, '')).toBe('Nikon Z 6II');
  });
});
