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

describe('toFields의 BODY', () => {
  it('니콘처럼 모델명에 제조사가 겹치면 겹치는 앞머리를 뗍니다', () => {
    // 사용자의 실제 니콘 D750 사진: 하단 바에 NIKON · NIKON D750 처럼 브랜드가 두 번
    // 나오던 결함입니다.
    const fields = toFields(meta({ make: 'NIKON CORPORATION', model: 'NIKON D750' }));
    expect(fields.BODY).toBe('D750');
  });

  it('소니의 내부 코드명 ILCE-7M3은 실제 표기 A7M3으로 바뀝니다', () => {
    // 사용자 요청: 소니 바디는 ILCE- 코드명이 아니라 A7M3처럼 그립니다.
    const fields = toFields(meta({ make: 'SONY', model: 'ILCE-7M3' }));
    expect(fields.BODY).toBe('A7M3');
  });

  it('후지필름처럼 ILCE-로 시작하지 않는 모델은 손대지 않습니다', () => {
    const fields = toFields(meta({ make: 'FUJIFILM', model: 'X-T4' }));
    expect(fields.BODY).toBe('X-T4');
  });

  it('모델이 없으면 키 자체가 없습니다', () => {
    const fields = toFields(meta({ make: 'SONY' }));
    expect('BODY' in fields).toBe(false);
  });
});

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
