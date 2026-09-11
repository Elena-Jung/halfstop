import { describe, expect, it } from 'vitest';
import { bodyLabel, brandId, brandLabel } from './brandId';

describe('brandId', () => {
  it('사용자의 실제 사진(SONY ILCE-7M3, 탐론 A063 렌즈)의 제조사 문자열을 알아봅니다', () => {
    // map.test.ts 와 presets.test.ts 가 쓰는 것과 같은 실제 EXIF 값입니다.
    expect(brandId('SONY')).toBe('sony');
  });

  it('꼬리가 붙은 니콘 표기를 알아봅니다', () => {
    expect(brandId('NIKON CORPORATION')).toBe('nikon');
  });

  it('캐논의 짧은 표기를 알아봅니다', () => {
    // 흔한 브랜드라 반드시 걸려야 합니다. 로고 그림은 registry.test.ts 가 따로 확인합니다.
    expect(brandId('Canon')).toBe('canon');
  });

  it('꼬리가 붙은 올림푸스의 옛 표기를 알아봅니다', () => {
    expect(brandId('OLYMPUS IMAGING CORP.')).toBe('olympus');
  });

  it('대소문자가 섞인 파나소닉 표기를 알아봅니다', () => {
    expect(brandId('Panasonic')).toBe('panasonic');
  });

  it('쉼표와 마침표가 섞인 리코 표기를 알아봅니다', () => {
    expect(brandId('RICOH IMAGING COMPANY, LTD.')).toBe('ricoh');
  });

  it('OM 시스템의 바디 표기를 알아봅니다', () => {
    expect(brandId('OM Digital Solutions')).toBe('om-system');
  });

  it('핫셀블라드 표기를 알아봅니다', () => {
    expect(brandId('Hasselblad')).toBe('hasselblad');
  });

  it('resolveLensMaker 가 돌려준 렌즈 제조사 이름도 같은 함수로 바꿉니다', () => {
    // lensMaker.ts 의 추론 결과는 이미 대문자 브랜드명입니다.
    expect(brandId('TAMRON')).toBe('tamron');
    expect(brandId('SIGMA')).toBe('sigma');
  });

  it('알아보지 못하는 문자열은 undefined 입니다', () => {
    expect(brandId('Some Unknown Brand')).toBeUndefined();
  });

  it('빈 문자열은 undefined 입니다', () => {
    expect(brandId('')).toBeUndefined();
  });

  it('값이 없으면 undefined 입니다', () => {
    expect(brandId(undefined)).toBeUndefined();
  });
});

describe('brandLabel', () => {
  it('법인격 꼬리를 떼어 자리를 넘기지 않게 합니다', () => {
    // 사용자의 실제 니콘 사진에서 NIKON CORPORATION 이 프레임에서 잘렸습니다.
    expect(brandLabel('NIKON CORPORATION')).toBe('NIKON');
    expect(brandLabel('OLYMPUS IMAGING CORP.')).toBe('OLYMPUS');
    expect(brandLabel('RICOH IMAGING COMPANY, LTD.')).toBe('RICOH');
  });

  it('라이카의 법인명에서 CAMERA 와 AG 를 뗍니다', () => {
    // bodyLabel 이 이 값을 모델명과 견주므로 여기서 LEICA 한 단어로 줄어야 합니다.
    expect(brandLabel('LEICA CAMERA AG')).toBe('LEICA');
  });

  it('원문의 대소문자를 그대로 둡니다', () => {
    // 브랜드마다 표기가 달라 한쪽으로 맞추면 어느 쪽이든 어색해집니다.
    expect(brandLabel('Canon')).toBe('Canon');
    expect(brandLabel('SONY')).toBe('SONY');
    expect(brandLabel('Panasonic')).toBe('Panasonic');
  });

  it('뗄 꼬리가 없으면 그대로 돌려줍니다', () => {
    expect(brandLabel('OM Digital Solutions')).toBe('OM Digital Solutions');
  });

  it('값이 없으면 undefined 입니다', () => {
    expect(brandLabel(undefined)).toBeUndefined();
  });
});

describe('bodyLabel', () => {
  it('니콘처럼 모델명 앞에 제조사가 붙은 경우 뗍니다', () => {
    // 브리프의 실제 결함: 하단 바에 NIKON · NIKON D750 처럼 브랜드가 두 번 나왔습니다.
    expect(bodyLabel('NIKON D750', 'NIKON CORPORATION')).toBe('D750');
  });

  it('캐논처럼 모델명 앞에 제조사가 붙은 경우 뗍니다', () => {
    expect(bodyLabel('Canon EOS R5', 'Canon')).toBe('EOS R5');
  });

  it('라이카처럼 모델명 앞에 제조사가 붙은 경우 뗍니다', () => {
    expect(bodyLabel('LEICA Q2', 'LEICA CAMERA AG')).toBe('Q2');
  });

  it('소니처럼 겹치지 않는 모델명은 그대로 둡니다', () => {
    expect(bodyLabel('ILCE-7M3', 'SONY')).toBe('ILCE-7M3');
  });

  it('후지필름처럼 겹치지 않는 모델명은 그대로 둡니다', () => {
    expect(bodyLabel('X-T4', 'FUJIFILM')).toBe('X-T4');
  });

  it('모델명이 우연히 다른 브랜드 이름으로 시작해도 낱말 경계가 없으면 떼지 않습니다', () => {
    // 리코 바디의 모델명이 PENTAX 로 시작하지만 제조사는 RICOH 입니다. 겹치지 않으므로
    // 떼면 안 됩니다.
    expect(bodyLabel('PENTAX K-3', 'RICOH IMAGING COMPANY, LTD.')).toBe('PENTAX K-3');
  });

  it('앞머리 뒤가 낱말 경계가 아니면 떼지 않습니다', () => {
    // 제조사 OM 이 모델 OM-1 에서 잘못 걸리면 뗀 뒤 1 만 남아 뜻을 잃습니다.
    expect(bodyLabel('OM-1', 'OM Digital Solutions')).toBe('OM-1');
  });

  it('떼고 나면 빈 문자열이 되는 경우 원래 값을 그대로 돌려줍니다', () => {
    expect(bodyLabel('NIKON', 'NIKON CORPORATION')).toBe('NIKON');
  });

  it('제조사가 없으면 모델을 그대로 돌려줍니다', () => {
    expect(bodyLabel('NIKON D750', undefined)).toBe('NIKON D750');
  });

  it('모델이 없으면 undefined 입니다', () => {
    expect(bodyLabel(undefined, 'NIKON CORPORATION')).toBeUndefined();
  });
});
