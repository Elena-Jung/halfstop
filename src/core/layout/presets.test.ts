import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRESET_ID,
  PRESETS,
  layoutFor,
  optionsFor,
  presetById,
  valuesFor,
} from './presets';
import { ARRANGEMENTS } from './arrangements';
import { BAR_OPTIONS, barLayout } from './layouts/bar';
import { MATTE_OPTIONS, matteLayout } from './layouts/matte';
import type { LayoutInput, LayoutServices } from './types';

/** 배치가 통째로 정하는 여덟 값입니다. presets.ts 의 values 는 이 키를 담지 않습니다. */
const ARRANGEMENT_VALUE_KEYS = [
  'MODE',
  'ALIGN',
  'DIVIDER',
  'PRIMARY_MAIN',
  'PRIMARY_SUB',
  'SECONDARY_MAIN',
  'SECONDARY_SUB',
  'FOOTER',
];

describe('PRESETS', () => {
  it('프레임 전용 다섯 개입니다', () => {
    expect(PRESETS.map((p) => p.id)).toEqual(['bar', 'film', 'polaroid', 'letterbox', 'poster']);
  });

  it('바 계열이 둘, 액자 계열이 셋입니다', () => {
    expect(PRESETS.filter((p) => p.layout === 'bar')).toHaveLength(2);
    expect(PRESETS.filter((p) => p.layout === 'matte')).toHaveLength(3);
  });

  it('다섯 프레임의 값이 표와 같습니다', () => {
    // 프리셋은 데이터입니다. 값이 표류하면 조용히 다른 프레임이 되므로 여기서 못박습니다.
    // bar 가 비어 있는 것이 의도입니다. 선언 기본값(BAR_HEIGHT 102, FONT_SIZE 34)이 곧
    // 기본 프레임이라 같은 값이 두 곳에 적히지 않습니다.
    const values = Object.fromEntries(PRESETS.map((p) => [p.id, p.values]));
    expect(values).toEqual({
      bar: {},
      film: {
        BACKGROUND: '#000000',
        TEXT_COLOR: '#ff9500',
        FONT_FAMILY: 'jetbrains-mono',
        FONT_SIZE: 30,
        BAR_HEIGHT: 100,
      },
      polaroid: { PAD_TOP: 70, PAD_RIGHT: 70, PAD_BOTTOM: 240, PAD_LEFT: 70 },
      letterbox: {
        PAD_TOP: 160,
        PAD_RIGHT: 0,
        PAD_BOTTOM: 160,
        PAD_LEFT: 0,
        BACKGROUND: '#000000',
        TEXT_COLOR: '#c8c8c8',
        FONT_SIZE: 26,
      },
      poster: {
        PAD_TOP: 120,
        PAD_RIGHT: 120,
        PAD_BOTTOM: 420,
        PAD_LEFT: 120,
        BACKGROUND: '#f4f2ee',
        FONT_SIZE: 26,
        SUB_SCALE: 2.6,
      },
    });
  });

  it('모든 프리셋에 이름표 키가 있습니다', () => {
    for (const preset of PRESETS) {
      expect(preset.labelKey.length).toBeGreaterThan(0);
    }
  });

  it('선언에 없는 옵션 키를 값 묶음에 넣지 않습니다', () => {
    for (const preset of PRESETS) {
      const declared = new Set(optionsFor(preset).map((o) => o.id));
      for (const key of Object.keys(preset.values)) {
        expect(declared.has(key), `${preset.id} 의 ${key}`).toBe(true);
      }
    }
  });

  it('배치가 정하는 여덟 값을 values 에 두지 않습니다', () => {
    // 두 곳이 같은 값을 정하면 어느 쪽이 이기는지가 모호해집니다. 배치가 통째로
    // 정하도록 프리셋의 values 는 이 여덟 키를 아예 담지 않아야 합니다.
    for (const preset of PRESETS) {
      for (const key of ARRANGEMENT_VALUE_KEYS) {
        expect(Object.hasOwn(preset.values, key), `${preset.id} 의 ${key}`).toBe(false);
      }
    }
  });

  it('프리셋이 배치를 가리키지 않습니다', () => {
    // 프리셋마다 배치를 하나씩 달아 두었더니 두 목록이 거울처럼 보였습니다. 프레임을
    // 고르는 것이 배치를 바꾸면 두 칸의 역할이 다시 섞입니다.
    for (const preset of PRESETS) {
      expect(Object.hasOwn(preset, 'arrangementId'), preset.id).toBe(false);
    }
  });
});

describe('presetById', () => {
  it('id 로 찾습니다', () => {
    expect(presetById(DEFAULT_PRESET_ID).id).toBe(DEFAULT_PRESET_ID);
  });

  it('모르는 id 는 기본 프레임으로 떨어집니다', () => {
    expect(presetById('없는-id').id).toBe(DEFAULT_PRESET_ID);
  });

  it('없어진 프리셋 id 가 저장값에 남아 있어도 기본 프레임으로 떨어집니다', () => {
    // 프리셋이 아홉에서 다섯으로 줄기 전의 localStorage 값입니다. 던지거나 화면을 비우지
    // 않고 기본 프레임으로 갑니다.
    for (const gone of ['body-lens', 'gear-exposure', 'one-line', 'shot-on', 'minimal']) {
      expect(presetById(gone).id, gone).toBe(DEFAULT_PRESET_ID);
    }
  });
});

describe('optionsFor 와 layoutFor', () => {
  it('레이아웃에 맞는 선언과 함수를 돌려줍니다', () => {
    const bar = PRESETS.find((p) => p.layout === 'bar')!;
    const matte = PRESETS.find((p) => p.layout === 'matte')!;
    expect(optionsFor(bar)).toBe(BAR_OPTIONS);
    expect(layoutFor(bar)).toBe(barLayout);
    expect(optionsFor(matte)).toBe(MATTE_OPTIONS);
    expect(layoutFor(matte)).toBe(matteLayout);
  });
});

describe('프리셋 기본 문구', () => {
  // 완성형 한글 음절 범위입니다. 화면에 그려지는 값에 이 범위의 글자가 있으면
  // 안내 문구가 실수로 캔버스에 그려지는 것입니다.
  const HANGUL_SYLLABLE = /[가-힣]/;
  const TEXT_KEYS = ['PRIMARY_MAIN', 'PRIMARY_SUB', 'SECONDARY_MAIN', 'SECONDARY_SUB', 'FOOTER'];

  it('화면에 그려지는 기본 문구에 한국어 안내 문구가 없습니다', () => {
    for (const preset of PRESETS) {
      const values = valuesFor(preset, {});
      for (const key of TEXT_KEYS) {
        const value = values.get(key);
        if (typeof value !== 'string') continue; // 해당 레이아웃에 없는 키입니다.
        if (value.startsWith('{')) continue; // 템플릿 토큰은 문구가 아닙니다.
        expect(HANGUL_SYLLABLE.test(value), `${preset.id}.${key} = "${value}"`).toBe(false);
      }
    }
  });
});

describe('프리셋 값과 coerce', () => {
  it('모든 프리셋 값이 coerce 를 그대로 통과합니다', () => {
    for (const preset of PRESETS) {
      const values = valuesFor(preset, {});
      for (const [key, expected] of Object.entries(preset.values)) {
        expect(values.get(key), `${preset.id}.${key}`).toBe(expected);
      }
    }
  });
});

describe('valuesFor', () => {
  it('배치가 선언 기본값을 덮습니다', () => {
    // bar 레이아웃의 기본 배치는 exposure-gear 입니다. 선언 기본값의 PRIMARY_MAIN 은
    // '{MAKER}{BODY}'인데 exposure-gear 가 노출값으로 덮습니다.
    const values = valuesFor(presetById('bar'), {});
    expect(values.get('PRIMARY_MAIN')).toBe('{MM}{F}{SEC}');
    expect(values.get('PRIMARY_SUB')).toBe('{ISO}{TAKEN_AT}');
    expect(values.get('SECONDARY_SUB')).toBe('{LENS}');
    expect(values.get('FOOTER')).toBe('');
  });

  it('프리셋 값이 선언 기본값을 덮습니다', () => {
    const values = valuesFor(presetById('film'), {});
    expect(values.get('BACKGROUND')).toBe('#000000');
    expect(values.get('BAR_HEIGHT')).toBe(100);
  });

  it('저장된 값이 프리셋 값을 덮습니다', () => {
    const values = valuesFor(presetById('film'), { BAR_HEIGHT: 300 });
    expect(values.get('BAR_HEIGHT')).toBe(300);
    expect(values.get('BACKGROUND')).toBe('#000000');
  });

  it('저장된 값이 이상하면 선언 기본값이 아니라 프리셋 값으로 떨어집니다', () => {
    const preset = presetById('film');
    const clean = valuesFor(preset, {});
    const dirty = valuesFor(preset, { BAR_HEIGHT: '높게', GHOST: 1 });
    // 필름은 바 높이를 100 으로 덮습니다. 선언 기본값 102 로 돌아가면 안 됩니다.
    expect(dirty.get('BAR_HEIGHT')).toBe(clean.get('BAR_HEIGHT'));
    expect(dirty.get('BAR_HEIGHT')).toBe(100);
    expect(dirty.has('GHOST')).toBe(false);
  });

  it('넘겨받은 배치의 여덟 값을 깝니다', () => {
    const values = valuesFor(presetById('bar'), {}, 'minimal');
    expect(values.get('MODE')).toBe('single');
    expect(values.get('ALIGN')).toBe('left');
    expect(values.get('FOOTER')).toBe('');
  });

  it('그 레이아웃에서 쓸 수 없는 배치를 넘기면 레이아웃의 기본 배치로 떨어집니다', () => {
    // poster 배치는 matte 전용입니다. bar 프레임에 억지로 넘기면 MODE 가 poster 로
    // 새는 대신 bar 의 기본 배치인 exposure-gear 가 깔립니다.
    const values = valuesFor(presetById('bar'), {}, 'poster');
    expect(values.get('MODE')).toBe('split');
    expect(values.get('PRIMARY_MAIN')).toBe('{MM}{F}{SEC}');
  });

  it('모르는 배치 id 도 레이아웃의 기본 배치로 떨어집니다', () => {
    const values = valuesFor(presetById('polaroid'), {}, '없는-배치');
    expect(values.get('PRIMARY_MAIN')).toBe('{MAKER}{BODY}');
    expect(values.get('SECONDARY_MAIN')).toBe('{MM}{F}{SEC}{ISO}');
  });
});

describe('프리셋 이름표 키', () => {
  it('다섯 프리셋이 preset. 으로 시작하는 키를 갖습니다', () => {
    for (const preset of PRESETS) {
      expect(preset.labelKey).toBe(`preset.${preset.id}`);
    }
  });

  it('한국어 문자열을 직접 담지 않습니다', () => {
    for (const preset of PRESETS) {
      expect(/[가-힣]/.test(preset.labelKey), preset.id).toBe(false);
    }
  });
});

describe('bar 프레임과 body-lens 배치의 좌우 대칭', () => {
  const services: LayoutServices = {
    measureText: (text, style) => text.length * style.size * 0.5,
    hasLogo: () => false,
  };

  function sceneTexts(fields: LayoutInput['fields']): string[] {
    const preset = presetById('bar');
    const input: LayoutInput = {
      photo: { width: 1500, height: 1000 },
      fields,
      logoId: undefined,
      options: valuesFor(preset, {}, 'body-lens'),
    };
    const scene = layoutFor(preset)(input, services);
    return scene.nodes.filter((node) => node.kind === 'text').map((node) => node.text);
  }

  it('사용자의 실제 사진처럼 렌즈 제조사를 알아내면 왼쪽처럼 오른쪽도 제조사와 모델 두 줄입니다', () => {
    // SONY ILCE-7M3 바디에 탐론 E 28-75mm F2.8 A063 렌즈. resolveLensMaker 가 LENS_MAKER 를
    // TAMRON 으로 채워 왔다고 가정합니다(map.test.ts 가 그 채움 자체를 검증합니다).
    expect(
      sceneTexts({
        MAKER: 'SONY',
        BODY: 'ILCE-7M3',
        LENS: 'E 28-75mm F2.8 A063',
        LENS_MAKER: 'TAMRON',
      }),
    ).toEqual(['SONY', 'ILCE-7M3', 'TAMRON', 'E 28-75mm F2.8 A063']);
  });

  it('렌즈 제조사를 못 알아내면 오른쪽이 렌즈 모델 한 줄로 접힙니다', () => {
    // LENS_MAKER 가 없는 경우입니다. 지금까지의 모습(오른쪽 한 줄)이 그대로 유지되어야
    // 합니다. resolveLensMaker 가 undefined 를 돌려주면 map.ts 가 이 키 자체를 넣지 않습니다.
    expect(
      sceneTexts({
        MAKER: 'SONY',
        BODY: 'ILCE-7M3',
        LENS: 'E 28-75mm F2.8 A063',
      }),
    ).toEqual(['SONY', 'ILCE-7M3', 'E 28-75mm F2.8 A063']);
  });
});

describe('다섯 프레임에서는 글자가 줄지 않습니다', () => {
  // bar 레이아웃은 슬롯이 글자 두 줄 높이보다 좁으면 글자를 줄여 사진을 덮지 않게 합니다.
  // 다섯 프레임의 값은 이미 그 조건을 지키므로 줄이는 계수가 정확히 1 이고, 1 을 곱한 값은
  // 비트까지 같아 장면이 달라지지 않습니다. 그 계수가 1 인지는 그려진 글자 크기가 옵션 값
  // 그대로인지로 확인합니다.
  //
  // 손으로 셈한 여유입니다. bar 프레임은 바 102 에 꼬리 줄이 있으면 슬롯 69.36, 없으면
  // 102 이고 글자 34 의 두 줄 높이는 34*0.62*2 = 42.16 입니다. film 프레임은 바 100 에
  // 슬롯 68 또는 100 이고 글자 30 의 두 줄 높이는 37.2 입니다. 어느 쪽도 좁지 않습니다.
  const services: LayoutServices = {
    measureText: (text, style) => text.length * style.size * 0.5,
    hasLogo: () => false,
  };

  const fields: LayoutInput['fields'] = {
    MAKER: 'SONY',
    BODY: 'ILCE-7M3',
    LENS: 'FE 24-70mm F2.8 GM',
    LENS_MAKER: 'SONY',
    MM: '35mm',
    F: 'f/2.8',
    SEC: '1/500s',
    ISO: 'ISO 200',
    TAKEN_AT: '2026-09-10 12:00',
  };

  for (const preset of PRESETS) {
    for (const arrangement of ARRANGEMENTS.filter((a) => a.layouts.includes(preset.layout))) {
      it(`${preset.id} 프레임에 ${arrangement.id} 배치를 얹어도 글자 크기가 옵션 값 그대로입니다`, () => {
        const options = valuesFor(preset, {}, arrangement.id);
        const fontSize = options.get('FONT_SIZE') as number;
        const subSize = fontSize * (options.get('SUB_SCALE') as number);
        const scene = layoutFor(preset)(
          { photo: { width: 1500, height: 1000 }, fields, logoId: undefined, options },
          services,
        );
        const sizes = scene.nodes.filter((node) => node.kind === 'text').map((node) => node.style.size);
        expect(sizes.length).toBeGreaterThan(0);
        for (const size of sizes) {
          expect([fontSize, subSize], `${preset.id}/${arrangement.id}`).toContain(size);
        }
      });
    }
  }
});

describe('배치별 장면 문구, 프리셋을 줄이기 전후로 같습니다', () => {
  // 없어진 다섯 프리셋의 문구 구성은 같은 이름의 배치에 그대로 남아 있습니다. 목록에서
  // 빠질 뿐 기능이 사라지는 것이 아니라는 약속을 기계로 붙잡는 자리입니다.
  //
  // 아래 문자열은 프리셋이 아홉이던 시절 코드에서 같은 fields 로 실제로 뽑아낸 값입니다.
  // 구현과 같은 식으로 다시 계산하지 않고 값을 그대로 못박습니다. 프레임은 그 레이아웃의
  // 기본 프레임(bar, polaroid)을 씁니다. 프레임이 달라도 문구가 같아야 축이 갈린 것입니다.
  //
  // 예외 하나. poster 배치는 PRIMARY_SUB 가 비어 있어 matte 의 세 줄 경로를 타지 않습니다.
  // 세 줄로 채우는 것은 poster 의 모습을 바꾸는 별도 결정이 필요합니다.
  const services: LayoutServices = {
    measureText: (text, style) => text.length * style.size * 0.5,
    hasLogo: () => false,
  };

  const fields: LayoutInput['fields'] = {
    MAKER: 'SONY',
    BODY: 'ILCE-7M3',
    LENS: 'FE 24-70mm F2.8 GM',
    LENS_MAKER: 'SONY',
    MM: '35mm',
    F: 'f/2.8',
    SEC: '1/500s',
    ISO: 'ISO 200',
    TAKEN_AT: '2026-09-10 12:00',
  };

  const BEFORE: Record<string, string[]> = {
    'body-lens/bar': ['SONY', 'ILCE-7M3', 'SONY', 'FE 24-70mm F2.8 GM', '35mm · f/2.8 · 1/500s · ISO 200'],
    'gear-exposure/bar': ['SONY · ILCE-7M3', 'FE 24-70mm F2.8 GM', '35mm · f/2.8', '1/500s · ISO 200'],
    'one-line/bar': ['SONY · ILCE-7M3 · 35mm · f/2.8 · 1/500s · ISO 200'],
    'shot-on/bar': ['Shot on SONY · ILCE-7M3', '35mm · f/2.8 · 1/500s · ISO 200'],
    'minimal/bar': ['SONY ILCE-7M3'],
    'film/bar': ['2026-09-10 12:00', '35mm f/2.8 1/500s ISO 200'],
    'polaroid/matte': ['SONY · ILCE-7M3', '35mm · f/2.8 · 1/500s · ISO 200'],
    'letterbox/matte': ['SONY · ILCE-7M3 · 35mm · f/2.8'],
    'poster/matte': ['2026-09-10 12:00', 'SONY · ILCE-7M3 · 35mm'],
    'one-block/bar': ['SONY · ILCE-7M3 · FE 24-70mm F2.8 GM', '35mm · f/2.8 · 1/500s · ISO 200'],
    'one-block/matte': ['SONY · ILCE-7M3 · FE 24-70mm F2.8 GM', '35mm · f/2.8 · 1/500s · ISO 200'],
    'exposure-gear/bar': [
      '35mm · f/2.8 · 1/500s',
      'ISO 200 · 2026-09-10 12:00',
      'SONY · ILCE-7M3',
      'FE 24-70mm F2.8 GM',
    ],
  };

  function sceneTextsFor(arrangementId: string, layout: 'bar' | 'matte'): string[] {
    const preset = presetById(layout === 'bar' ? 'bar' : 'polaroid');
    const input: LayoutInput = {
      photo: { width: 1500, height: 1000 },
      fields,
      logoId: undefined,
      options: valuesFor(preset, {}, arrangementId),
    };
    const scene = layoutFor(preset)(input, services);
    return scene.nodes.filter((node) => node.kind === 'text').map((node) => node.text);
  }

  const pairs = ARRANGEMENTS.flatMap((a) => a.layouts.map((layout) => `${a.id}/${layout}`));

  it('BEFORE 표가 배치와 레이아웃의 모든 짝을 담습니다', () => {
    expect(Object.keys(BEFORE).sort()).toEqual([...pairs].sort());
  });

  for (const arrangement of ARRANGEMENTS) {
    for (const layout of arrangement.layouts) {
      it(`${arrangement.id}/${layout} 의 장면 문구가 그대로입니다`, () => {
        expect(sceneTextsFor(arrangement.id, layout)).toEqual(BEFORE[`${arrangement.id}/${layout}`]);
      });
    }
  }
});
