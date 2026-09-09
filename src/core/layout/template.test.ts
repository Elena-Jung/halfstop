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

  it('소문자 토큰은 토큰으로 인식하지 않고 중괄호를 그대로 둡니다', () => {
    expect(renderTemplate('{maker}', FULL, '·')).toBe('{maker}');
  });

  it('닫는 중괄호가 없으면 리터럴 그대로 남습니다', () => {
    expect(renderTemplate('{MAKER', FULL, '·')).toBe('{MAKER');
  });

  it('빈 템플릿은 빈 문자열입니다', () => {
    expect(renderTemplate('', FULL, '·')).toBe('');
  });

  it('같은 토큰이 반복되면 각각 치환되어 구분자로 이어집니다', () => {
    expect(renderTemplate('{MAKER}{MAKER}', FULL, '.')).toBe('Nikon . Nikon');
  });

  it('중첩된 중괄호는 안쪽 토큰만 치환되고 바깥 중괄호는 리터럴로 남습니다', () => {
    // 실제로 돌려서 나온 값을 그대로 적었습니다. 여는 중괄호는 값 앞
    // 리터럴로, 닫는 중괄호는 마지막 꼬리 조각으로 남아 중괄호 개수는
    // 보존됩니다 (여는 것 하나, 닫는 것 하나).
    expect(renderTemplate('{{MAKER}}', FULL, '.')).toBe('{Nikon . }');
  });
});
