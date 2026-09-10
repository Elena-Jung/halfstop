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

/**
 * 해요체 종결 어미만 골라 냅니다. 앞선 검사는 `요` 로 끝나기만 하면 잡아서 `중요` 와 `필요`
 * 같은 명사를 위반으로 몰았고, 반대로 문장 중간에 섞인 해요체는 놓쳤습니다.
 */
const HAEYO = /(?:아요|어요|여요|예요|에요|해요|세요|게요|까요|네요|죠)(?=[\s.,!?]|$)/;

describe('해요체 검사', () => {
  it('명사가 요 로 끝나는 것을 위반으로 잡지 않습니다', () => {
    for (const ok of ['중요', '필요', '중요한 값입니다']) {
      expect(HAEYO.test(ok), ok).toBe(false);
    }
  });

  it('문장 끝과 문장 중간의 해요체를 모두 잡습니다', () => {
    for (const bad of ['사진을 골라 주세요', '이렇게 했어요, 다시 하십시오', '어떨까요']) {
      expect(HAEYO.test(bad), bad).toBe(true);
    }
  });

  it('습니다체와 하십시오체를 위반으로 잡지 않습니다', () => {
    for (const ok of ['불러왔습니다', '여기에 놓으십시오', '만드는 중입니다']) {
      expect(HAEYO.test(ok), ok).toBe(false);
    }
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
      expect(HAEYO.test(value), `${key}: ${value}`).toBe(false);
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
