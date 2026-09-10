import { describe, expect, it } from 'vitest';
import { ko } from '../i18n/ko';
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

describe('사전의 모든 오류 키에 닿는 길이 있습니다', () => {
  // 사전에만 있고 아무 규칙도 가리키지 않는 키는 영영 화면에 나오지 않습니다.
  // 반대로 core 가 던지는데 규칙이 없는 문구는 "알 수 없는 문제" 로 떨어집니다.
  const CASES: readonly [string, string][] = [
    ['지원하지 않는 파일 형식입니다', 'error.decode'],
    ['HEIC는 다음 단계에서 지원합니다', 'error.decode'],
    ['RAW는 다음 단계에서 지원합니다', 'error.decode'],
    ['사진 크기가 올바르지 않습니다: 0x0', 'error.decode'],
    ['측정용 2D 컨텍스트를 만들지 못했습니다', 'error.canvas'],
    ['회전용 2D 컨텍스트를 만들지 못했습니다', 'error.canvas'],
    ['2D 컨텍스트를 만들지 못했습니다', 'error.canvas'],
    ['이 환경에서는 캔버스를 쓸 수 없습니다: 0, 0', 'error.canvas'],
    ['image/webp 인코딩을 지원하지 않습니다. 받은 형식은 image/png입니다', 'error.canvas'],
    ['내보내기 크기가 올바르지 않습니다: -800x1000 -> 1600', 'error.exportSize'],
    ['Array buffer allocation failed', 'error.tooLarge'],
    ['워커에서 오류가 났습니다', 'error.worker'],
  ];

  it('core 가 실제로 던지는 문구가 뜻에 맞는 키로 갑니다', () => {
    for (const [message, key] of CASES) {
      expect(toUserMessage(new Error(message)), message).toBe(key);
    }
  });

  it('사전의 error. 키가 모두 어느 규칙에든 닿습니다', () => {
    const reachable = new Set<string>(RULES.map((r) => r.key));
    reachable.add('error.unknown');
    for (const key of Object.keys(ko)) {
      if (!key.startsWith('error.')) continue;
      expect(reachable.has(key), key).toBe(true);
    }
  });
});
