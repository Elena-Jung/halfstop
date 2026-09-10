import { describe, expect, it } from 'vitest';
import { RULES, toUserMessage } from './errorMessage';

describe('toUserMessage', () => {
  it('지원하지 않는 파일 형식 문구를 디코딩 실패 키로 바꿉니다', () => {
    expect(toUserMessage(new Error('지원하지 않는 파일 형식입니다'))).toBe('error.decode');
  });

  it('HEIC 문구를 디코딩 실패 키로 바꿉니다', () => {
    expect(toUserMessage(new Error('HEIC는 다음 단계에서 지원합니다'))).toBe('error.decode');
  });

  it('RAW 문구를 디코딩 실패 키로 바꿉니다', () => {
    expect(toUserMessage(new Error('RAW는 다음 단계에서 지원합니다'))).toBe('error.decode');
  });

  it('사진 크기 오류 문구를 디코딩 실패 키로 바꿉니다', () => {
    expect(toUserMessage(new Error('사진 크기가 올바르지 않습니다: 0x0'))).toBe('error.decode');
  });

  it('인코딩 미지원 문구를 캔버스 키로 바꿉니다', () => {
    expect(
      toUserMessage(new Error('image/webp 인코딩을 지원하지 않습니다. 받은 형식은 image/png입니다')),
    ).toBe('error.canvas');
  });

  it('워커 관련 문구를 워커 키로 바꿉니다', () => {
    expect(toUserMessage(new Error('워커에서 오류가 났습니다'))).toBe('error.worker');
  });

  it('알려지지 않은 오류는 unknown 키를 돌려줍니다', () => {
    expect(toUserMessage(new Error('완전히 새로운 오류 문구'))).toBe('error.unknown');
  });

  it('Error가 아닌 값도 unknown 키를 돌려줍니다', () => {
    expect(toUserMessage('문자열 오류')).toBe('error.unknown');
    expect(toUserMessage(undefined)).toBe('error.unknown');
    expect(toUserMessage(null)).toBe('error.unknown');
  });

  it('규칙에 등록된 모든 키가 사전에 정의된 키 형식입니다', () => {
    for (const rule of RULES) {
      expect(rule.key).toMatch(/^error\./);
    }
  });
});
