import { describe, expect, it } from 'vitest';
import { inferLensMaker, resolveLensMaker } from './lensMaker';

describe('inferLensMaker', () => {
  it('사용자의 실제 문자열은 탐론 코드로 판별됩니다', () => {
    // E 28-75mm F2.8 A063. 소니 바디가 기록한 렌즈 모델 문자열입니다. 이 문자열은
    // 소니 E 마운트 규칙(^(FE|E) \d)에도 걸리므로, 탐론 코드 규칙이 배열에서 먼저
    // 오지 않으면 SONY로 잘못 판별됩니다.
    expect(inferLensMaker('E 28-75mm F2.8 A063')).toBe('TAMRON');
  });

  it('탐론 코드 B로 끝나는 모델도 탐론으로 판별됩니다', () => {
    expect(inferLensMaker('28-200mm F2.8-5.6 Di III RXD B070')).toBe('TAMRON');
  });

  it('SIGMA로 시작하면 SIGMA입니다', () => {
    expect(inferLensMaker('SIGMA 35mm F1.4 DG HSM | A')).toBe('SIGMA');
  });

  it('TAMRON으로 시작하면 TAMRON입니다', () => {
    expect(inferLensMaker('TAMRON 17-28mm F2.8 Di III RXD')).toBe('TAMRON');
  });

  it('SAMYANG으로 시작하면 SAMYANG입니다', () => {
    expect(inferLensMaker('SAMYANG AF 35mm F1.4 FE')).toBe('SAMYANG');
  });

  it('ROKINON으로 시작해도 SAMYANG입니다. 같은 렌즈의 두 이름입니다', () => {
    expect(inferLensMaker('ROKINON 35mm F1.4 AS UMC')).toBe('SAMYANG');
  });

  it('ZEISS로 시작하면 ZEISS입니다', () => {
    expect(inferLensMaker('ZEISS Milvus 50mm F1.4')).toBe('ZEISS');
  });

  it('Batis로 시작해도 ZEISS입니다', () => {
    expect(inferLensMaker('Batis 25mm F2')).toBe('ZEISS');
  });

  it('Loxia로 시작해도 ZEISS입니다', () => {
    expect(inferLensMaker('Loxia 21mm F2.8')).toBe('ZEISS');
  });

  it('Voigtlander로 시작하면 VOIGTLANDER입니다', () => {
    expect(inferLensMaker('Voigtlander NOKTON 40mm F1.2')).toBe('VOIGTLANDER');
  });

  it('전부 대문자인 VOIGTLANDER도 같은 결과입니다', () => {
    expect(inferLensMaker('VOIGTLANDER APO-LANTHAR 50mm F2')).toBe('VOIGTLANDER');
  });

  it('NIKKOR를 포함하면 NIKON입니다', () => {
    expect(inferLensMaker('AF-S NIKKOR 50mm f/1.8G')).toBe('NIKON');
  });

  it('FE로 시작하는 소니 E 마운트 표기는 SONY입니다', () => {
    expect(inferLensMaker('FE 24-70mm F2.8 GM')).toBe('SONY');
  });

  it('E로 시작하는 소니 E 마운트 표기도 SONY입니다', () => {
    expect(inferLensMaker('E 16-55mm F2.8 G')).toBe('SONY');
  });

  it('RF로 시작하면 CANON입니다', () => {
    expect(inferLensMaker('RF24-70mm F2.8 L IS USM')).toBe('CANON');
  });

  it('EF-S로 시작해도 CANON입니다', () => {
    expect(inferLensMaker('EF-S18-55mm f/3.5-5.6 IS STM')).toBe('CANON');
  });

  it('EF로 시작해도 CANON입니다', () => {
    expect(inferLensMaker('EF50mm f/1.8 STM')).toBe('CANON');
  });

  it('어떤 규칙에도 맞지 않으면 undefined입니다', () => {
    expect(inferLensMaker('Unknown Lens 50mm')).toBeUndefined();
  });

  it('모델 문자열이 없으면 undefined입니다', () => {
    expect(inferLensMaker(undefined)).toBeUndefined();
  });
});

describe('resolveLensMaker', () => {
  it('추론이 EXIF의 LensMake보다 먼저입니다', () => {
    // 소니 바디가 탐론 렌즈를 물리고 LensMake에 자기 이름 SONY를 적어 둔
    // 상황입니다. 이것을 그대로 쓰면 틀린 제조사를 사진에 새겨 넣습니다.
    expect(resolveLensMaker('E 28-75mm F2.8 A063', 'SONY')).toBe('TAMRON');
  });

  it('추론이 안 맞을 때만 EXIF의 LensMake로 떨어집니다', () => {
    expect(resolveLensMaker('Unknown Lens 50mm', 'PENTAX')).toBe('PENTAX');
  });

  it('추론도 안 맞고 EXIF값도 없으면 undefined입니다', () => {
    expect(resolveLensMaker('Unknown Lens 50mm', undefined)).toBeUndefined();
  });

  it('렌즈 모델 자체가 없고 EXIF값만 있으면 EXIF값을 씁니다', () => {
    expect(resolveLensMaker(undefined, 'SONY')).toBe('SONY');
  });

  it('둘 다 없으면 undefined입니다', () => {
    expect(resolveLensMaker(undefined, undefined)).toBeUndefined();
  });
});
