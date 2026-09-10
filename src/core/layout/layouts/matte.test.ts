import { describe, expect, it } from 'vitest';
import { MATTE_OPTIONS, matteLayout } from './matte';
import { defaultValues } from '../options';
import { halfHeight, twoLineGap } from '../primitives';
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

  it('single 모드에서 부 줄이 주 줄보다 커도(SUB_SCALE 3) 두 줄 간격이 두 크기 합의 절반 이상입니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'single');
    options.set('PRIMARY_SUB', '{MM}');
    options.set('SUB_SCALE', 3);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    const main = nodes.find((n) => n.text === 'Canon · EOS R6');
    const sub = nodes.find((n) => n.text === '50mm');
    expect(main).toBeDefined();
    expect(sub).toBeDefined();
    const gap = Math.abs((sub?.y ?? 0) - (main?.y ?? 0));
    expect(gap).toBeGreaterThanOrEqual((30 + 90) / 2);
    // areaCenterY = 1160. wanted = max(37.5, 74.4) = 74.4, room = 200-111.6=88.4, gap = 74.4.
    expect(main?.y).toBeCloseTo(1122.8);
    expect(sub?.y).toBeCloseTo(1197.2);
  });

  it('가운데 줄 자체가 아래 여백보다 크면 poster 는 여백을 넘습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PRIMARY_SUB', '여름의 끝');
    options.set('SUB_SCALE', 3);
    options.set('PAD_BOTTOM', 100);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    const areaTop = 60 + 1000;
    const EPSILON = 1e-9;
    // 바깥 두 줄은 step 이 붙잡아 주므로 여백 안에 정확히 맞닿습니다.
    for (const node of [nodes[0]!, nodes[2]!]) {
      expect(node.y - halfHeight(node.style.size)).toBeGreaterThanOrEqual(areaTop - EPSILON);
      expect(node.y + halfHeight(node.style.size)).toBeLessThanOrEqual(scene.height + EPSILON);
    }
    // 가운데 줄은 언제나 areaCenterY 에 놓이므로 step 이 손댈 수 없습니다. 반높이 55.8 이
    // 여백 절반 50 을 넘어 위아래로 각각 5.8 씩 삐져나옵니다. 이 한계를 숫자로 못박아 두어,
    // 옵션 범위로 막기 전까지 조용히 나빠지지 않게 합니다.
    const middle = nodes[1]!;
    expect(areaTop - (middle.y - halfHeight(middle.style.size))).toBeCloseTo(5.8);
    expect(middle.y + halfHeight(middle.style.size) - scene.height).toBeCloseTo(5.8);
  });

  it('아래 여백이 큰 줄 하나보다도 좁으면 간격이 0 이 되고 그 줄이 여백을 넘습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'single');
    options.set('PRIMARY_SUB', '여름의 끝');
    options.set('SUB_SCALE', 3);
    options.set('PAD_BOTTOM', 100);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    // room 이 음수라 간격이 0 으로 좁혀지고 두 줄이 같은 자리에 놓입니다.
    expect(nodes[0]?.y).toBeCloseTo(nodes[1]?.y ?? 0);
    // bar 의 좁은 슬롯과 같은 한계입니다. 간격으로는 더 줄일 수 없습니다.
    const big = nodes.find((n) => n.style.size === 90);
    expect(big?.y ?? 0).toBeCloseTo(1110);
    expect((big?.y ?? 0) + halfHeight(90) - scene.height).toBeCloseTo(5.8);
  });

  it('SUB_SCALE를 3으로 올린 poster에서 세 줄이 서로 겹치지 않습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PRIMARY_SUB', '여름의 끝');
    options.set('SUB_SCALE', 3);
    const nodes = textNodes(matteLayout(input({ options }), services).nodes);
    expect(nodes.length).toBe(3);
    // 여백 안에 들어오는 것만으로는 부족합니다. 가운데 줄이 위아래 줄을 덮을 수 있습니다.
    // step 을 제한하는 것은 바깥 두 줄뿐이므로 여기서는 세 줄이 정확히 맞닿습니다.
    const EPSILON = 1e-9;
    for (let i = 0; i + 1 < nodes.length; i += 1) {
      const upper = nodes[i]!;
      const lower = nodes[i + 1]!;
      const upperBottom = upper.y + halfHeight(upper.style.size);
      const lowerTop = lower.y - halfHeight(lower.style.size);
      expect(lowerTop).toBeGreaterThanOrEqual(upperBottom - EPSILON);
    }
  });

  it('아래 여백이 두 줄을 담기에 좁으면 간격을 좁혀 여백 안에 붙잡아 둡니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'single');
    options.set('PAD_BOTTOM', 150);
    options.set('PRIMARY_SUB', '여름의 끝');
    options.set('SUB_SCALE', 3);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes.length).toBe(2);
    // 원하는 간격은 74.4 지만 큰 쪽 반높이 두 개가 111.6 이라 남는 자리가 38.4 뿐입니다.
    // 이때는 겹침을 받아들이고 여백 밖으로 나가지 않는 쪽을 지킵니다. 밖으로 나가면 글이
    // 캔버스에서 잘려 아예 사라지기 때문입니다.
    const areaTop = 60 + 1000;
    const EPSILON = 1e-9;
    for (const node of nodes) {
      expect(node.y - halfHeight(node.style.size)).toBeGreaterThanOrEqual(areaTop - EPSILON);
      expect(node.y + halfHeight(node.style.size)).toBeLessThanOrEqual(scene.height + EPSILON);
    }
  });

  it('SUB_SCALE를 3으로 올린 poster에서 세 줄이 모두 아래 여백 안에 있습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PRIMARY_SUB', '여름의 끝');
    options.set('SUB_SCALE', 3);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    const areaTop = 60 + 1000; // padTop + photoHeight
    const height = 1000 + 60 + 200; // photoHeight + padTop + padBottom
    expect(nodes.length).toBe(3);
    for (const node of nodes) {
      const half = halfHeight(node.style.size);
      expect(node.y - half).toBeGreaterThanOrEqual(areaTop);
      expect(node.y + half).toBeLessThanOrEqual(height);
    }
  });

  it('PRIMARY_SUB 가 빈 poster 에서 남은 두 줄이 areaCenterY 를 기준으로 대칭이고 gap 만큼 떨어집니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    // PRIMARY_SUB 는 이미 기본값이 빈 문자열입니다.
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes).toHaveLength(2);
    const areaCenterY = 60 + 1000 + 200 / 2; // padTop + photoHeight + padBottom/2
    const fontSize = 30;
    const subSize = fontSize * 0.7; // 기본 SUB_SCALE
    const gap = twoLineGap(200, fontSize, subSize); // padBottom 기본값 200
    const [first, second] = nodes;
    expect((first!.y + second!.y) / 2).toBeCloseTo(areaCenterY);
    expect(second!.y - first!.y).toBeCloseTo(gap);
  });

  it('PRIMARY_SUB 와 SECONDARY_MAIN 이 모두 빈 poster 에서 남은 한 줄이 정확히 areaCenterY 에 놓입니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('SECONDARY_MAIN', '');
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes).toHaveLength(1);
    const areaCenterY = 60 + 1000 + 200 / 2;
    expect(nodes[0]?.y).toBeCloseTo(areaCenterY);
  });

  it('PAD_LEFT 0, PAD_RIGHT 0인 split에서 왼쪽 글의 x가 0보다 큽니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('PAD_LEFT', 0);
    options.set('PAD_RIGHT', 0);
    const scene = matteLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    const left = nodes.find((n) => n.style.align === 'left');
    expect(left).toBeDefined();
    expect(left?.x ?? 0).toBeGreaterThan(0);
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
