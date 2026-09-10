import { describe, expect, it } from 'vitest';
import { readTheme, writeTheme, type StorageLike } from './themeStore';

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

describe('writeTheme 와 readTheme', () => {
  it('쓴 것을 그대로 읽습니다', () => {
    const storage = fakeStorage();
    writeTheme('light', storage);
    expect(readTheme(storage)).toBe('light');
  });

  it('저장된 것이 없으면 null 입니다', () => {
    expect(readTheme(fakeStorage())).toBeNull();
  });

  it('dark 나 light 가 아닌 값은 null 입니다', () => {
    expect(readTheme(fakeStorage({ 'halfstop.theme.v1': 'system' }))).toBeNull();
  });

  it('읽기가 던져도 null 로 넘어갑니다', () => {
    expect(readTheme(throwingStorage())).toBeNull();
  });

  it('쓰기가 던져도 밖으로 새지 않습니다', () => {
    expect(() => writeTheme('dark', throwingStorage())).not.toThrow();
  });
});

describe('저장소를 안 넘겼을 때', () => {
  // 이 테스트는 localStorage 가 없는 환경에서 돕니다. 이름을 읽는 것만으로 ReferenceError
  // 가 나므로, 그 접근이 try 안에 있는지를 그대로 확인하는 셈입니다.
  it('읽기가 예외를 밖으로 내보내지 않고 null 을 돌려줍니다', () => {
    expect(() => readTheme()).not.toThrow();
    expect(readTheme()).toBeNull();
  });

  it('쓰기가 예외를 밖으로 내보내지 않습니다', () => {
    expect(() => writeTheme('light')).not.toThrow();
  });
});
