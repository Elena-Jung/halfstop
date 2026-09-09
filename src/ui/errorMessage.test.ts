import { describe, expect, it } from 'vitest';
import { RULES, toUserMessage } from './errorMessage';

const FALLBACK = '기본값이에요';

describe('toUserMessage', () => {
  it('지원하지 않는 파일 형식 문구를 해요체로 바꿉니다', () => {
    expect(toUserMessage(new Error('지원하지 않는 파일 형식입니다'), FALLBACK)).toBe(
      '이 형식은 아직 못 읽어요. JPEG, PNG, WebP 를 넣어 주세요',
    );
  });

  it('HEIC 문구를 해요체로 바꿉니다', () => {
    expect(toUserMessage(new Error('HEIC는 다음 단계에서 지원합니다'), FALLBACK)).toBe(
      'HEIC 는 아직 준비 중이에요. JPEG 로 바꿔서 넣어 주세요',
    );
  });

  it('RAW 문구를 해요체로 바꿉니다', () => {
    expect(toUserMessage(new Error('RAW는 다음 단계에서 지원합니다'), FALLBACK)).toBe(
      'RAW 는 아직 준비 중이에요. JPEG 로 바꿔서 넣어 주세요',
    );
  });

  it('사진 크기 오류 문구를 해요체로 바꿉니다', () => {
    expect(toUserMessage(new Error('사진 크기가 올바르지 않습니다: 0x0'), FALLBACK)).toBe(
      '사진 크기를 읽지 못했어요. 다른 파일로 해 보시겠어요',
    );
  });

  it('인코딩 미지원 문구를 해요체로 바꿉니다', () => {
    expect(
      toUserMessage(
        new Error('image/webp 인코딩을 지원하지 않습니다. 받은 형식은 image/png입니다'),
        FALLBACK,
      ),
    ).toBe('이 브라우저가 그 형식으로 저장하지 못해요');
  });

  it('워커 관련 문구를 해요체로 바꿉니다', () => {
    expect(toUserMessage(new Error('워커에서 오류가 났습니다'), FALLBACK)).toBe(
      '만드는 도중에 멈췄어요. 다시 눌러 주세요',
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

  it('규칙에 등록된 모든 문구가 해요체입니다', () => {
    for (const rule of RULES) {
      expect(rule.text).not.toMatch(/습니다$|입니다$/);
    }
  });
});
