import { describe, expect, it } from 'vitest';
import { RULES, toUserMessage } from './errorMessage';

const FALLBACK = '기본값입니다';

describe('toUserMessage', () => {
  it('지원하지 않는 파일 형식 문구를 사용자용으로 바꿉니다', () => {
    expect(toUserMessage(new Error('지원하지 않는 파일 형식입니다'), FALLBACK)).toBe(
      '이 형식은 아직 읽지 못합니다. JPEG, PNG, WebP 를 넣어 주십시오',
    );
  });

  it('HEIC 문구를 사용자용으로 바꿉니다', () => {
    expect(toUserMessage(new Error('HEIC는 다음 단계에서 지원합니다'), FALLBACK)).toBe(
      'HEIC 는 아직 준비 중입니다. JPEG 로 바꿔서 넣어 주십시오',
    );
  });

  it('RAW 문구를 사용자용으로 바꿉니다', () => {
    expect(toUserMessage(new Error('RAW는 다음 단계에서 지원합니다'), FALLBACK)).toBe(
      'RAW 는 아직 준비 중입니다. JPEG 로 바꿔서 넣어 주십시오',
    );
  });

  it('사진 크기 오류 문구를 사용자용으로 바꿉니다', () => {
    expect(toUserMessage(new Error('사진 크기가 올바르지 않습니다: 0x0'), FALLBACK)).toBe(
      '사진 크기를 읽지 못했습니다. 다른 파일로 시도해 주십시오',
    );
  });

  it('인코딩 미지원 문구를 사용자용으로 바꿉니다', () => {
    expect(
      toUserMessage(
        new Error('image/webp 인코딩을 지원하지 않습니다. 받은 형식은 image/png입니다'),
        FALLBACK,
      ),
    ).toBe('이 브라우저는 그 형식으로 저장하지 못합니다');
  });

  it('워커 관련 문구를 사용자용으로 바꿉니다', () => {
    expect(toUserMessage(new Error('워커에서 오류가 났습니다'), FALLBACK)).toBe(
      '만드는 도중에 멈췄습니다. 다시 눌러 주십시오',
    );
  });

  it('알려지지 않은 오류는 fallback을 돌려줍니다', () => {
    expect(toUserMessage(new Error('완전히 새로운 오류 문구'), FALLBACK)).toBe(FALLBACK);
  });

  it('Error가 아닌 값도 fallback을 돌려줍니다', () => {
    expect(toUserMessage('문자열 오류', FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(undefined, FALLBACK)).toBe(FALLBACK);
    expect(toUserMessage(null, FALLBACK)).toBe(FALLBACK);
  });

  it('규칙에 등록된 모든 문구가 습니다체입니다', () => {
    // 해요체 어미가 섞이지 않는지 봅니다. 앞으로 규칙을 더할 때 규약이 지켜지게
    // 하는 장치입니다.
    for (const rule of RULES) {
      expect(rule.text).not.toMatch(/(어요|아요|에요|예요|세요|해요)([\s.!?]|$)/);
    }
  });
});
