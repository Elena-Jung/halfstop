import { describe, expect, it } from 'vitest';
import { BAR_OPTIONS } from '../core/layout/layouts/bar';
import { MATTE_OPTIONS } from '../core/layout/layouts/matte';
import { PRESETS } from '../core/layout/presets';
import { ko } from './ko';
import { t } from './index';

describe('t', () => {
  it('키에 해당하는 문구를 돌려줍니다', () => {
    expect(t('action.download')).toBe(ko['action.download']);
  });

  it('중괄호 자리에 값을 끼워 넣습니다', () => {
    expect(t('status.loaded', { name: 'a.jpg' })).toBe('a.jpg 파일을 불러왔습니다');
  });

  it('값을 안 넘기면 자리표시자를 그대로 둡니다', () => {
    expect(t('status.loaded')).toContain('{name}');
  });
});

describe('사전', () => {
  it('빈 문구가 없습니다', () => {
    for (const [key, value] of Object.entries(ko)) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('해요체를 쓰지 않습니다', () => {
    // 습니다체만 씁니다. 종결형이 요 로 끝나는 문구를 걸러냅니다.
    for (const [key, value] of Object.entries(ko)) {
      expect(/요[.!?]?$/.test(value.trim()), `${key}: ${value}`).toBe(false);
    }
  });

  it('em-dash 와 en-dash 를 쓰지 않습니다', () => {
    for (const [key, value] of Object.entries(ko)) {
      expect(/[–—]/.test(value), key).toBe(false);
    }
  });

  it('모든 옵션과 프리셋의 키가 사전에 있습니다', () => {
    for (const option of [...BAR_OPTIONS, ...MATTE_OPTIONS]) {
      expect(Object.hasOwn(ko, option.labelKey), option.labelKey).toBe(true);
    }
    for (const preset of PRESETS) {
      expect(Object.hasOwn(ko, preset.labelKey), preset.labelKey).toBe(true);
    }
  });
});
