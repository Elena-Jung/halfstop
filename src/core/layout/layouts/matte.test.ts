import { describe, expect, it } from 'vitest';
import { MATTE_OPTIONS, matteLayout } from './matte';
import { defaultValues } from '../options';
import type { LayoutInput, LayoutServices, SceneNode } from '../types';

const services: LayoutServices = {
  measureText: (text, style) => text.length * style.size * 0.5,
  hasLogo: () => false,
};

function input(overrides: Partial<LayoutInput> = {}): LayoutInput {
  return {
    photo: { width: 1500, height: 1000 },
    fields: { MAKER: 'Canon', BODY: 'EOS R6', MM: '50mm', TAKEN_AT: '2026-09-09' },
    logoId: undefined,
    options: defaultValues(MATTE_OPTIONS),
    ...overrides,
  };
}

function textNodes(nodes: SceneNode[]) {
  return nodes.filter((n) => n.kind === 'text');
}

describe('matteLayout', () => {
  it('사방 여백만큼 캔버스가 사진보다 커집니다', () => {
    const scene = matteLayout(input(), services);
    // 기본 여백은 위 60, 오른쪽 60, 아래 200, 왼쪽 60 입니다.
    expect(scene.width).toBe(1500 + 60 + 60);
    expect(scene.height).toBe(1000 + 60 + 200);
  });

  it('사진을 왼쪽 위 여백만큼 밀어 놓습니다', () => {
    const scene = matteLayout(input(), services);
    expect(scene.nodes.find((n) => n.kind === 'image')).toEqual({
      kind: 'image',
      x: 60,
      y: 60,
      w: 1500,
      h: 1000,
    });
  });

  it('면마다 여백을 따로 받습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('PAD_LEFT', 0);
    options.set('PAD_RIGHT', 0);
    options.set('PAD_TOP', 150);
    options.set('PAD_BOTTOM', 150);
    const scene = matteLayout(input({ options }), services);
    expect(scene.width).toBe(1500);
    expect(scene.height).toBe(1000 + 300);
    expect(scene.nodes.find((n) => n.kind === 'image')).toMatchObject({ x: 0, y: 150 });
  });

  it('split 모드는 아래 여백에 좌우 두 덩어리를 놓습니다', () => {
    const scene = matteLayout(input(), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes.map((n) => n.style.align)).toEqual(['left', 'right']);
  });

  it('single 모드는 한 덩어리만 놓습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'single');
    options.set('ALIGN', 'center');
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.style.align).toBe('center');
  });

  it('poster 모드는 세 줄을 세로로 쌓고 가운데가 가장 큽니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PRIMARY_MAIN', '{TAKEN_AT}');
    options.set('PRIMARY_SUB', '여름의 끝');
    options.set('SECONDARY_MAIN', '{MAKER}{BODY}');
    options.set('SUB_SCALE', 2);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes.map((n) => n.text)).toEqual(['2026-09-09', '여름의 끝', 'Canon · EOS R6']);
    expect(nodes[1]?.style.size).toBeGreaterThan(nodes[0]?.style.size ?? 0);
    expect(nodes[1]?.style.size).toBeGreaterThan(nodes[2]?.style.size ?? 0);
  });

  it('poster 모드의 세 줄은 위에서 아래로 내려갑니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PRIMARY_SUB', '여름의 끝');
    const scene = matteLayout(input({ options }), services);
    const ys = textNodes(scene.nodes).map((n) => n.y);
    expect(ys[0]).toBeLessThan(ys[1] ?? 0);
    expect(ys[1]).toBeLessThan(ys[2] ?? 0);
  });

  it('배경색 옵션이 Scene 배경에 반영됩니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('BACKGROUND', '#000000');
    expect(matteLayout(input({ options }), services).background).toBe('#000000');
  });

  it('사진 크기가 달라도 같은 옵션이면 여백이 같습니다', () => {
    const wide = matteLayout(input({ photo: { width: 3000, height: 1000 } }), services);
    const square = matteLayout(input({ photo: { width: 1000, height: 1000 } }), services);
    expect(wide.height - 1000).toBe(square.height - 1000);
  });
});
