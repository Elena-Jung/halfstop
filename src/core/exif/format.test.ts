import { describe, expect, it } from 'vitest';
import {
  formatAperture,
  formatFocalLength,
  formatIso,
  formatShutter,
  formatTakenAt,
} from './format';

describe('formatShutter', () => {
  it('1초 미만은 분수로 씁니다', () => {
    expect(formatShutter(1 / 250)).toBe('1/250s');
    expect(formatShutter(0.004)).toBe('1/250s');
  });

  it('1초 이상은 초로 씁니다', () => {
    expect(formatShutter(1)).toBe('1s');
    expect(formatShutter(2.5)).toBe('2.5s');
    expect(formatShutter(30)).toBe('30s');
  });

  it('값이 없으면 undefined입니다', () => {
    expect(formatShutter(undefined)).toBeUndefined();
    expect(formatShutter(0)).toBeUndefined();
    expect(formatShutter(Number.NaN)).toBeUndefined();
  });

  it('1/N에 가깝지 않은 1초 미만 값은 소수로 씁니다', () => {
    expect(formatShutter(0.8)).toBe('0.8s');
    expect(formatShutter(0.6)).toBe('0.6s');
    expect(formatShutter(0.7)).toBe('0.7s');
  });

  it('1/N에 실제로 가까운 값은 여전히 분수로 씁니다', () => {
    expect(formatShutter(0.5)).toBe('1/2s');
    expect(formatShutter(1 / 3)).toBe('1/3s');
    expect(formatShutter(1 / 8000)).toBe('1/8000s');
  });
});

describe('formatAperture', () => {
  it('f 표기로 씁니다', () => {
    expect(formatAperture(1.8)).toBe('f/1.8');
    expect(formatAperture(8)).toBe('f/8');
    expect(formatAperture(5.6)).toBe('f/5.6');
  });

  it('값이 없으면 undefined입니다', () => {
    expect(formatAperture(undefined)).toBeUndefined();
    expect(formatAperture(0)).toBeUndefined();
  });
});

describe('formatFocalLength', () => {
  it('반올림해서 mm를 붙입니다', () => {
    expect(formatFocalLength(35, undefined)).toBe('35mm');
    expect(formatFocalLength(6.765, undefined)).toBe('7mm');
  });

  it('환산값이 다르면 괄호로 병기합니다', () => {
    expect(formatFocalLength(35, 52)).toBe('35mm (52mm)');
  });

  it('환산값이 같으면 병기하지 않습니다', () => {
    expect(formatFocalLength(35, 35)).toBe('35mm');
  });

  it('실초점거리가 없으면 환산값만 씁니다', () => {
    expect(formatFocalLength(undefined, 52)).toBe('52mm');
  });

  it('둘 다 없으면 undefined입니다', () => {
    expect(formatFocalLength(undefined, undefined)).toBeUndefined();
  });
});

describe('formatIso', () => {
  it('ISO 접두사를 붙입니다', () => {
    expect(formatIso(400)).toBe('ISO 400');
  });

  it('값이 없으면 undefined입니다', () => {
    expect(formatIso(undefined)).toBeUndefined();
    expect(formatIso(0)).toBeUndefined();
  });
});

describe('formatTakenAt', () => {
  it('EXIF 날짜 형식을 하이픈 형식으로 바꿉니다', () => {
    expect(formatTakenAt('2026:09:09 14:03:21')).toBe('2026-09-09');
  });

  it('형식이 다르면 undefined입니다', () => {
    expect(formatTakenAt('nope')).toBeUndefined();
    expect(formatTakenAt(undefined)).toBeUndefined();
  });
});
