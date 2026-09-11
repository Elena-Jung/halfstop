import { describe, expect, it } from 'vitest';
import { bodyName } from './bodyName';

describe('bodyName', () => {
  it('ILCE-7M3을 A7M3으로 바꿉니다', () => {
    expect(bodyName('ILCE-7M3')).toBe('A7M3');
  });

  it('ILCE-7RM5를 A7RM5로 바꿉니다', () => {
    expect(bodyName('ILCE-7RM5')).toBe('A7RM5');
  });

  it('ILCE-7SM3을 A7SM3으로 바꿉니다', () => {
    expect(bodyName('ILCE-7SM3')).toBe('A7SM3');
  });

  it('ILCE-7CM2를 A7CM2로 바꿉니다', () => {
    expect(bodyName('ILCE-7CM2')).toBe('A7CM2');
  });

  it('ILCE-9M3을 A9M3으로 바꿉니다', () => {
    expect(bodyName('ILCE-9M3')).toBe('A9M3');
  });

  it('ILCE-1을 A1로 바꿉니다', () => {
    expect(bodyName('ILCE-1')).toBe('A1');
  });

  it('ILCE-7을 A7로 바꿉니다', () => {
    expect(bodyName('ILCE-7')).toBe('A7');
  });

  it('ILCE-6700을 A6700으로 바꿉니다', () => {
    expect(bodyName('ILCE-6700')).toBe('A6700');
  });

  it('ILCA-99M2를 A99M2로 바꿉니다', () => {
    expect(bodyName('ILCA-99M2')).toBe('A99M2');
  });

  it('M3을 로마 숫자 III로 바꾸지 않습니다', () => {
    // 사용자가 코드명 그대로를 원합니다. 로마 숫자 변환을 넣으면 올림푸스의 E-M1이
    // E- I이 되는 함정까지 따라옵니다.
    expect(bodyName('ILCE-7M3')).not.toContain('III');
  });

  it('DSC-로 시작하는 소니 컴팩트는 손대지 않습니다', () => {
    // 소니 컴팩트는 DSC-를 붙여 파는 기종입니다. 사용자가 지목한 것은 ILCE 뿐입니다.
    expect(bodyName('DSC-RX100M7')).toBe('DSC-RX100M7');
  });

  it('올림푸스의 E-M1은 그대로 둡니다', () => {
    expect(bodyName('E-M1')).toBe('E-M1');
  });

  it('니콘의 D750은 그대로 둡니다', () => {
    expect(bodyName('D750')).toBe('D750');
  });

  it('후지필름의 X-T4는 그대로 둡니다', () => {
    expect(bodyName('X-T4')).toBe('X-T4');
  });

  it('모델이 없으면 undefined입니다', () => {
    expect(bodyName(undefined)).toBeUndefined();
  });
});
