import { describe, expect, it } from 'vitest';
import { toFields } from './map';
import type { PhotoMeta } from './read';

/** 이 테스트에서 안 쓰는 필드를 매번 채우지 않도록 최소값을 깔아 둡니다. */
function meta(overrides: Partial<PhotoMeta>): PhotoMeta {
  return {
    make: undefined,
    model: undefined,
    lensModel: undefined,
    lensMake: undefined,
    focalLength: undefined,
    focalLengthIn35mm: undefined,
    fNumber: undefined,
    iso: undefined,
    exposureTime: undefined,
    orientation: 1,
    takenAtRaw: undefined,
    pixelWidth: undefined,
    pixelHeight: undefined,
    ...overrides,
  };
}

describe('toFields의 LENS_MAKER', () => {
  it('사용자의 실제 사진처럼 소니 바디가 탐론 렌즈를 물리면 LENS_MAKER는 TAMRON입니다', () => {
    // 사용자 사진: SONY ILCE-7M3 바디, 탐론 E 28-75mm F2.8 A063 렌즈. 바디는
    // LensMake에 자기 이름 SONY를 적어 두었습니다. 이것을 그대로 쓰면 결함이 됩니다.
    const fields = toFields(
      meta({ make: 'SONY', model: 'ILCE-7M3', lensModel: 'E 28-75mm F2.8 A063', lensMake: 'SONY' }),
    );
    expect(fields.LENS_MAKER).toBe('TAMRON');
  });

  it('모델 문자열로 판별이 안 되면 EXIF의 LensMake로 떨어집니다', () => {
    const fields = toFields(meta({ lensModel: 'Unknown Lens 50mm', lensMake: 'PENTAX' }));
    expect(fields.LENS_MAKER).toBe('PENTAX');
  });

  it('판별도 안 되고 EXIF값도 없으면 키 자체가 없습니다', () => {
    const fields = toFields(meta({ lensModel: 'Unknown Lens 50mm' }));
    expect(fields.LENS_MAKER).toBeUndefined();
    expect('LENS_MAKER' in fields).toBe(false);
  });
});
