import { describe, expect, it } from 'vitest';
import { BAR_OPTIONS, barLayout } from './bar';
import { defaultValues } from '../options';
import { halfHeight } from '../primitives';
import type { LayoutInput, LayoutServices, SceneNode } from '../types';

const services: LayoutServices = {
  measureText: (text, style) => text.length * style.size * 0.5,
  hasLogo: () => false,
};

function input(overrides: Partial<LayoutInput> = {}): LayoutInput {
  return {
    photo: { width: 1500, height: 1000 },
    fields: {
      MAKER: 'Canon',
      BODY: 'EOS R6',
      LENS: 'RF 50mm',
      MM: '50mm',
      F: 'f/2.8',
      SEC: '1/250s',
      ISO: 'ISO 400',
    },
    logoId: undefined,
    options: defaultValues(BAR_OPTIONS),
    ...overrides,
  };
}

function texts(nodes: SceneNode[]): string[] {
  return nodes.filter((n) => n.kind === 'text').map((n) => n.text);
}

function textNodes(nodes: SceneNode[]) {
  return nodes.filter((n) => n.kind === 'text');
}

describe('barLayout split 모드', () => {
  it('사진 아래에 바 높이만큼 캔버스를 늘립니다', () => {
    const scene = barLayout(input(), services);
    expect(scene.width).toBe(1500);
    expect(scene.height).toBe(1000 + 120);
  });

  it('사진을 원점에 원본 크기로 놓습니다', () => {
    const scene = barLayout(input(), services);
    expect(scene.nodes.find((n) => n.kind === 'image')).toEqual({
      kind: 'image',
      x: 0,
      y: 0,
      w: 1500,
      h: 1000,
    });
  });

  it('좌우 주 줄을 만듭니다', () => {
    const scene = barLayout(input(), services);
    expect(texts(scene.nodes)).toEqual(['Canon · EOS R6', '50mm · f/2.8 · 1/250s · ISO 400']);
  });

  it('왼쪽은 왼쪽 정렬, 오른쪽은 오른쪽 정렬입니다', () => {
    const scene = barLayout(input(), services);
    const [left, right] = textNodes(scene.nodes);
    expect(left?.style.align).toBe('left');
    expect(right?.style.align).toBe('right');
  });

  it('부 줄을 넣으면 슬롯마다 두 줄이 됩니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('PRIMARY_SUB', '{LENS}');
    const scene = barLayout(input({ options }), services);
    expect(texts(scene.nodes)).toContain('RF 50mm');
    expect(textNodes(scene.nodes)).toHaveLength(3);
  });

  it('부 줄은 주 줄보다 작습니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('PRIMARY_SUB', '{LENS}');
    const scene = barLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    const main = nodes.find((n) => n.text === 'Canon · EOS R6');
    const sub = nodes.find((n) => n.text === 'RF 50mm');
    expect(sub?.style.size).toBeLessThan(main?.style.size ?? 0);
  });

  it('FOOTER 를 넣으면 가운데 아래에 한 줄이 더 생깁니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('FOOTER', '{ISO}');
    const scene = barLayout(input({ options }), services);
    const footer = textNodes(scene.nodes).find((n) => n.text === 'ISO 400');
    expect(footer?.style.align).toBe('center');
    expect(footer?.x).toBe(750);
  });
});

describe('barLayout 두 줄 y 좌표', () => {
  it('FOOTER와 PRIMARY_SUB를 함께 두면 주 줄과 부 줄이 사진 아래에 있고 꼬리 줄과 겹치지 않습니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('PRIMARY_SUB', '{LENS}');
    options.set('FOOTER', '{ISO}');
    const scene = barLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    const main = nodes.find((n) => n.text === 'Canon · EOS R6');
    const sub = nodes.find((n) => n.text === 'RF 50mm');
    const footer = nodes.find((n) => n.text === 'ISO 400');
    expect(main).toBeDefined();
    expect(sub).toBeDefined();
    expect(footer).toBeDefined();
    // BAR_HEIGHT 120 기본값: slotHeight 81.6, slotCenterY 1040.8. 남은 높이가 81.6 이고
    // 큰 쪽 글자의 반높이 두 개가 34*1.24=42.16 이므로 gap 은 원하는 42.5 가 아니라 39.44
    // 로 좁혀집니다. 그 결과 주 줄의 글자 상단이 정확히 1000, 즉 사진 경계에 맞닿습니다.
    expect(main?.y).toBeCloseTo(1021.08);
    expect(sub?.y).toBeCloseTo(1060.52);
    expect(footer?.y).toBeCloseTo(1100.8);
    // 앵커가 아니라 글자 상단으로 확인합니다. 앵커만 보면 글자가 사진을 덮어도 통과합니다.
    // 주 줄은 경계에 정확히 맞닿으므로 이진 부동소수점에서 1000 을 머리카락만큼 밑돕니다.
    const EPSILON = 1e-9;
    expect((main?.y ?? 0) - halfHeight(34)).toBeGreaterThanOrEqual(1000 - EPSILON);
    expect((sub?.y ?? 0) - halfHeight(23.8)).toBeGreaterThanOrEqual(1000 - EPSILON);
    // 부 줄과 꼬리 줄은 둘 다 글자 크기가 23.8이므로, 반높이의 합(23.8*0.62*2)
    // 이상 떨어져 있어야 겹치지 않습니다.
    expect((footer?.y ?? 0) - (sub?.y ?? 0)).toBeGreaterThanOrEqual(halfHeight(23.8) * 2);
  });

  it('슬롯이 한 줄보다 좁아지면 두 줄 간격을 0으로 좁힙니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('BAR_HEIGHT', 60);
    options.set('PRIMARY_SUB', '{LENS}');
    options.set('FOOTER', '{ISO}');
    const scene = barLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes.length).toBe(4);
    const main = nodes.find((n) => n.text === 'Canon · EOS R6');
    const sub = nodes.find((n) => n.text === 'RF 50mm');
    // slotHeight 가 40.8 인데 34 크기 글자 한 줄이 차지하는 높이가 42.16 입니다. 두 줄을
    // 넣을 자리가 애초에 없으므로 간격을 0 까지 좁혀 둘을 겹쳐 놓는 것이 최선입니다.
    // 이 조합에서는 글자 상단이 999.32 로 사진을 0.68 만큼 덮습니다. 간격으로는 더 줄일 수
    // 없고 글자 크기나 바 높이를 손대야 합니다. 설정 화면에서 막을 몫으로 남겨 둡니다.
    expect(main?.y).toBeCloseTo(1020.4);
    expect(sub?.y).toBeCloseTo(1020.4);
    // 남은 침범을 숫자로 못박아 둡니다. 앵커만 보는 검사로는 침범이 더 나빠져도 통과합니다.
    expect((main?.y ?? 0) - halfHeight(34)).toBeCloseTo(999.32);
  });
});

describe('barLayout 로고 겹침', () => {
  it('MODE single, ALIGN center, 로고가 있으면 글이 로고 오른쪽 끝을 넘어서지 않습니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    options.set('MODE', 'single');
    options.set('ALIGN', 'center');
    options.set('PRIMARY_MAIN', '가'.repeat(200));
    const scene = barLayout(input({ options, logoId: 'canon' }), withLogo);
    const node = textNodes(scene.nodes)[0];
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    expect(node).toBeDefined();
    expect(logo).toBeDefined();
    const textWidth = services.measureText(node!.text, node!.style);
    const leftEdge = node!.x - textWidth / 2;
    const logoRight = (logo?.x ?? 0) + (logo?.w ?? 0);
    expect(leftEdge).toBeGreaterThan(logoRight);
  });
});

describe('barLayout single 모드', () => {
  it('가운데 정렬이면 한 덩어리가 가운데에 놓입니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'center');
    const scene = barLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.style.align).toBe('center');
    expect(nodes[0]?.x).toBe(750);
  });

  it('왼쪽 정렬이면 여백만큼 들어와서 시작합니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'left');
    const scene = barLayout(input({ options }), services);
    const node = textNodes(scene.nodes)[0];
    expect(node?.style.align).toBe('left');
    expect(node?.x).toBe(60);
  });

  it('오른쪽 정렬이면 오른쪽 여백에서 끝납니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'right');
    const scene = barLayout(input({ options }), services);
    expect(textNodes(scene.nodes)[0]?.x).toBe(1440);
  });

  it('SECONDARY 슬롯은 쓰지 않습니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('MODE', 'single');
    const scene = barLayout(input({ options }), services);
    expect(texts(scene.nodes)).not.toContain('50mm · f/2.8 · 1/250s · ISO 400');
  });
});

describe('barLayout 공통', () => {
  it('배경색 옵션이 Scene 배경에 반영됩니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('BACKGROUND', '#000000');
    expect(barLayout(input({ options }), services).background).toBe('#000000');
  });

  it('바 높이 옵션이 캔버스 높이에 반영됩니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('BAR_HEIGHT', 300);
    expect(barLayout(input({ options }), services).height).toBe(1300);
  });

  it('사진 크기가 달라도 같은 옵션이면 바 높이가 같습니다', () => {
    const wide = barLayout(input({ photo: { width: 3000, height: 1000 } }), services);
    const square = barLayout(input({ photo: { width: 1000, height: 1000 } }), services);
    expect(wide.height - 1000).toBe(square.height - 1000);
  });

  it('기본 서체는 Inter 입니다', () => {
    const scene = barLayout(input(), services);
    expect(textNodes(scene.nodes)[0]?.style.family).toContain('Inter');
  });

  it('서체 옵션을 바꾸면 텍스트 스타일이 따라갑니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('FONT_FAMILY', 'jetbrains-mono');
    const scene = barLayout(input({ options }), services);
    expect(textNodes(scene.nodes)[0]?.style.family).toContain('JetBrains');
  });

  it('SHOW_LOGO 를 켜고 로고가 있으면 logo 노드를 만듭니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    const scene = barLayout(input({ options, logoId: 'canon' }), withLogo);
    expect(scene.nodes.find((n) => n.kind === 'logo')).toMatchObject({ logoId: 'canon' });
  });

  it('SHOW_LOGO 를 켜도 로고가 없으면 logo 노드를 만들지 않습니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    const scene = barLayout(input({ options, logoId: 'canon' }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
  });
});

describe('barLayout SHOW_LOGO 기본값', () => {
  it('기본은 꺼짐이라 로고가 있어도 logo 노드를 만들지 않습니다', () => {
    // 기본을 꺼짐으로 둔 이유는 body-lens 처럼 {MAKER}를 이미 글자로 그리는 배치에서
    // 브랜드 이름이 두 번(글자와 로고) 나오지 않게 하기 위해서입니다.
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const scene = barLayout(input({ logoId: 'sony' }), withLogo);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
  });

  it('기본은 꺼짐이라 워드마크도 그리지 않습니다', () => {
    const scene = barLayout(input({ logoId: 'canon' }), services);
    expect(texts(scene.nodes)).not.toContain('Canon');
  });
});

describe('barLayout 워드마크 폴백', () => {
  // 워드마크 크기는 logoHeight * 0.45 입니다. 기본 BAR_HEIGHT 120 에서
  // logoHeight = 48 이므로 size = 21.6 입니다. 이 목(mock) 측정기(글자당 size*0.5)로는
  // 'ABC' 석 자가 3*21.6*0.5 = 32.4 가 되어 logoWidth(72)에 여유 있게 들어갑니다.
  // 길게 넘치는 경우의 줄임(ellipsize)은 아래 '브랜드 이름이 로고 자리 폭을 넘으면
  // 줄입니다' 테스트가 따로 확인하므로, 여기서는 짧은 이름으로 폴백 자체와 자리를
  // 확인합니다.
  const shortMakerFields: LayoutInput['fields'] = {
    MAKER: 'ABC',
    BODY: 'EOS R6',
    LENS: 'RF 50mm',
    MM: '50mm',
    F: 'f/2.8',
    SEC: '1/250s',
    ISO: 'ISO 400',
  };

  it('SHOW_LOGO 를 켰는데 그 브랜드의 로고가 없으면 브랜드 이름을 글자로 그립니다', () => {
    // 캐논은 쓸 만한 출처를 못 찾아 로고 그림이 없습니다(registry.ts). 이 자리가 그
    // 워드마크 폴백입니다.
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    const scene = barLayout(input({ options, logoId: 'canon', fields: shortMakerFields }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
    expect(texts(scene.nodes)).toContain('ABC');
  });

  it('워드마크는 로고와 같은 자리(왼쪽 여백)에 놓입니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);

    const withRealLogo = barLayout(input({ options, logoId: 'sony', fields: shortMakerFields }), withLogo);
    const logo = withRealLogo.nodes.find((n) => n.kind === 'logo');

    const withWordmark = barLayout(input({ options, logoId: 'canon', fields: shortMakerFields }), services);
    // PRIMARY 슬롯도 align:'left' 라 텍스트만으로는 못 가릅니다. 워드마크는 로고와
    // 같은 x(패딩)에 놓이고 PRIMARY 는 로고/워드마크가 예약한 폭만큼 더 들어간
    // x(패딩+logoGap)에 놓이므로, 좌표로 구분합니다.
    const wordmark = textNodes(withWordmark.nodes).find((n) => n.x === logo?.x);

    expect(logo).toBeDefined();
    expect(wordmark).toBeDefined();
    expect(wordmark?.text).toBe('ABC');
    expect(wordmark?.style.align).toBe('left');
  });

  it('로고와 워드마크가 예약하는 폭이 같아, 켜고 끌 때 옆 텍스트 배치가 흔들리지 않습니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);

    const withRealLogo = barLayout(input({ options, logoId: 'sony', fields: shortMakerFields }), withLogo);
    const withWordmark = barLayout(input({ options, logoId: 'canon', fields: shortMakerFields }), services);

    // 오른쪽(SECONDARY) 슬롯의 x 는 애초에 logoGap 의 영향을 받지 않습니다(오른쪽 끝
    // 기준). 폭이 흔들리지 않는지는 왼쪽(PRIMARY) 슬롯의 x 로 확인해야 뜻이 있습니다.
    const primaryText = 'ABC · EOS R6';
    const leftTextWithLogo = textNodes(withRealLogo.nodes).find((n) => n.text === primaryText);
    const leftTextWithWordmark = textNodes(withWordmark.nodes).find((n) => n.text === primaryText);
    expect(leftTextWithLogo).toBeDefined();
    expect(leftTextWithLogo?.x).toBe(leftTextWithWordmark?.x);
  });

  it('브랜드 이름이 로고 자리 폭을 넘으면 줄입니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    const scene = barLayout(
      input({ options, logoId: 'canon', fields: { MAKER: '가'.repeat(200) } }),
      services,
    );
    const wordmark = textNodes(scene.nodes).find((n) => n.x === 60);
    expect(wordmark?.text.endsWith('…')).toBe(true);
  });

  it('MAKER 필드가 없으면 로고 id 가 있어도 워드마크를 그리지 않습니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    const scene = barLayout(input({ options, logoId: 'canon', fields: {} }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
    expect(textNodes(scene.nodes).some((n) => n.x === 60 && n.style.align === 'left')).toBe(false);
  });
});
