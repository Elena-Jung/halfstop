import { describe, expect, it } from 'vitest';
import { BAR_OPTIONS, barLayout } from './bar';
import { defaultValues } from '../options';
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

  it('로고가 있으면 logo 노드를 만듭니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const scene = barLayout(input({ logoId: 'canon' }), withLogo);
    expect(scene.nodes.find((n) => n.kind === 'logo')).toMatchObject({ logoId: 'canon' });
  });

  it('로고가 없으면 logo 노드를 만들지 않습니다', () => {
    const scene = barLayout(input({ logoId: 'canon' }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
  });
});
