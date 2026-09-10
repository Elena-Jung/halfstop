export type { StorageLike } from './settingsStore';
import type { StorageLike } from './settingsStore';

const KEY = 'halfstop.theme.v1';

export type Theme = 'dark' | 'light';

/**
 * settingsStore.ts 와 같은 이유로 이 함수는 반드시 아래 두 함수의 try 안에서만
 * 부릅니다. localStorage 는 이름을 읽는 것만으로 던질 수 있습니다.
 */
function browserStorage(): StorageLike {
  return localStorage;
}

/**
 * 저장된 값이 dark 나 light 가 아니면 예전 버전이 남긴 것이거나 사용자가 손댄
 * 것입니다. null 을 돌려주고 부르는 쪽이 기본값(어두운 테마)을 쓰게 합니다.
 */
export function readTheme(storage?: StorageLike): Theme | null {
  try {
    const raw = (storage ?? browserStorage()).getItem(KEY);
    return raw === 'dark' || raw === 'light' ? raw : null;
  } catch {
    return null;
  }
}

export function writeTheme(theme: Theme, storage?: StorageLike): void {
  try {
    (storage ?? browserStorage()).setItem(KEY, theme);
  } catch {
    // 사생활 보호 모드에서는 저장이 막힙니다. 테마가 안 남는 것이 도구를 못 쓸 이유는
    // 아니므로 조용히 넘깁니다.
  }
}
