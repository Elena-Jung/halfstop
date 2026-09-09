import { describe, expect, it } from 'vitest';
import { isRenderReply, nextJobId } from './protocol';

describe('nextJobId', () => {
  it('부를 때마다 커집니다', () => {
    const a = nextJobId();
    const b = nextJobId();
    expect(b).toBeGreaterThan(a);
  });
});

describe('isRenderReply', () => {
  it('성공 응답을 알아봅니다', () => {
    const reply = { id: 1, ok: true, blob: new Blob(), width: 10, height: 5, clamped: false };
    expect(isRenderReply(reply)).toBe(true);
  });

  it('실패 응답을 알아봅니다', () => {
    expect(isRenderReply({ id: 1, ok: false, message: '실패' })).toBe(true);
  });

  it('id가 없으면 응답이 아닙니다', () => {
    expect(isRenderReply({ ok: true })).toBe(false);
  });

  it('ok가 불리언이 아니면 응답이 아닙니다', () => {
    expect(isRenderReply({ id: 1, ok: 'yes' })).toBe(false);
  });

  it('객체가 아니면 응답이 아닙니다', () => {
    expect(isRenderReply(null)).toBe(false);
    expect(isRenderReply('ok')).toBe(false);
    expect(isRenderReply(undefined)).toBe(false);
  });
});
