import { describe, expect, it } from 'vitest';
import { readSettings, writeSettings, type StorageLike } from './settingsStore';

function fakeStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
}

function throwingStorage(): StorageLike {
  return {
    getItem: () => {
      throw new Error('사생활 보호 모드');
    },
    setItem: () => {
      throw new Error('사생활 보호 모드');
    },
  };
}

describe('writeSettings 와 readSettings', () => {
  it('쓴 것을 그대로 읽습니다', () => {
    const storage = fakeStorage();
    writeSettings({ presetId: 'minimal', values: { BAR_HEIGHT: 300 } }, storage);
    expect(readSettings(storage)).toEqual({ presetId: 'minimal', values: { BAR_HEIGHT: 300 } });
  });

  it('저장된 것이 없으면 null 입니다', () => {
    expect(readSettings(fakeStorage())).toBeNull();
  });

  it('JSON 이 깨져 있으면 null 입니다', () => {
    expect(readSettings(fakeStorage({ 'halfstop.settings.v1': '{{{' }))).toBeNull();
  });

  it('presetId 가 문자열이 아니면 null 입니다', () => {
    const storage = fakeStorage({ 'halfstop.settings.v1': '{"presetId":7,"values":{}}' });
    expect(readSettings(storage)).toBeNull();
  });

  it('values 가 객체가 아니면 null 입니다', () => {
    const storage = fakeStorage({ 'halfstop.settings.v1': '{"presetId":"a","values":3}' });
    expect(readSettings(storage)).toBeNull();
  });

  it('읽기가 던져도 null 로 넘어갑니다', () => {
    expect(readSettings(throwingStorage())).toBeNull();
  });

  it('쓰기가 던져도 밖으로 새지 않습니다', () => {
    expect(() => writeSettings({ presetId: 'a', values: {} }, throwingStorage())).not.toThrow();
  });
});

describe('저장소를 안 넘겼을 때', () => {
  // 이 테스트는 localStorage 가 없는 환경에서 돕니다. 이름을 읽는 것만으로 ReferenceError
  // 가 나므로, 그 접근이 try 안에 있는지를 그대로 확인하는 셈입니다.
  it('읽기가 예외를 밖으로 내보내지 않고 null 을 돌려줍니다', () => {
    expect(() => readSettings()).not.toThrow();
    expect(readSettings()).toBeNull();
  });

  it('쓰기가 예외를 밖으로 내보내지 않습니다', () => {
    expect(() => writeSettings({ presetId: 'a', values: {} })).not.toThrow();
  });
});
