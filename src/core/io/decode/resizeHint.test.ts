import { describe, expect, it } from 'vitest';
import { resizeHint } from './resizeHint';

describe('resizeHint', () => {
  it('상한이 없으면 축소하지 않습니다', () => {
    expect(resizeHint(undefined, { width: 6000, height: 4000 })).toEqual({});
  });

  it('가로 사진은 가로를 상한에 맞춥니다', () => {
    expect(resizeHint(1600, { width: 6000, height: 4000 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('세로 사진은 세로를 상한에 맞춥니다', () => {
    expect(resizeHint(1600, { width: 4000, height: 6000 })).toEqual({
      resizeHeight: 1600,
      resizeQuality: 'high',
    });
  });

  it('이미 상한보다 작으면 축소하지 않습니다', () => {
    expect(resizeHint(1600, { width: 1200, height: 800 })).toEqual({});
  });

  it('정사각형은 가로를 기준으로 잡습니다', () => {
    expect(resizeHint(1600, { width: 3000, height: 3000 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('원본 크기를 모르면 가로를 기준으로 잡습니다', () => {
    expect(resizeHint(1600, undefined)).toEqual({ resizeWidth: 1600, resizeQuality: 'high' });
  });

  it('원본 크기가 0이면 모르는 것으로 봅니다', () => {
    expect(resizeHint(1600, { width: 0, height: 0 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('가로가 NaN이면 모르는 것으로 봅니다', () => {
    expect(resizeHint(1600, { width: Number.NaN, height: 4000 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('세로가 NaN이면 모르는 것으로 봅니다', () => {
    expect(resizeHint(1600, { width: 6000, height: Number.NaN })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('가로가 무한대이면 모르는 것으로 봅니다', () => {
    expect(resizeHint(1600, { width: Number.POSITIVE_INFINITY, height: 4000 })).toEqual({
      resizeWidth: 1600,
      resizeQuality: 'high',
    });
  });

  it('긴 변이 상한과 정확히 같으면 축소하지 않습니다', () => {
    expect(resizeHint(1600, { width: 1600, height: 1200 })).toEqual({});
  });
});
