const KEY = 'halfstop.settings.v1';

export interface StoredSettings {
  presetId: string;
  values: Record<string, unknown>;
}

/** 테스트에서 가짜를 넣을 수 있도록 필요한 두 메서드만 받습니다. */
export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

/**
 * localStorage 는 이름을 읽는 것만으로 던질 수 있습니다. 워커 안이거나, allow-same-origin
 * 없는 iframe 이거나, 쿠키를 막아 둔 브라우저가 그렇습니다. 그래서 이 함수는 반드시 아래
 * 두 함수의 try 안에서만 부릅니다. 기본 인자 자리에 두면 try 밖에서 평가되어 예외가
 * 그대로 새어 나갑니다.
 */
function browserStorage(): StorageLike {
  return localStorage;
}

/**
 * 저장된 값은 사용자가 직접 고쳤거나 예전 버전이 남긴 것일 수 있습니다. 모양이 어긋나면
 * 통째로 버리고 기본값으로 시작합니다. 개별 값의 검증은 coerce 가 맡습니다.
 */
export function readSettings(storage?: StorageLike): StoredSettings | null {
  try {
    const raw = (storage ?? browserStorage()).getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || parsed === null) return null;
    const { presetId, values } = parsed as Partial<StoredSettings>;
    if (typeof presetId !== 'string') return null;
    if (typeof values !== 'object' || values === null || Array.isArray(values)) return null;
    return { presetId, values };
  } catch {
    return null;
  }
}

export function writeSettings(settings: StoredSettings, storage?: StorageLike): void {
  try {
    (storage ?? browserStorage()).setItem(KEY, JSON.stringify(settings));
  } catch {
    // 사생활 보호 모드에서는 저장이 막힙니다. 설정이 안 남는 것이 도구를 못 쓸 이유는
    // 아니므로 조용히 넘깁니다.
  }
}
