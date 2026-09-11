import { describe, expect, it } from 'vitest';
import { MATTE_OPTIONS, matteLayout } from './matte';
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
    // 남는 두 줄은 둘 다 FONT_SIZE 30 입니다. 그리지 않는 부 줄의 크기는 간격에 끼어들지
    // 않아야 합니다. wanted = max(30*1.25, 18.6+18.6) = 37.5 이고 room = 200-37.2 = 162.8
    // 이므로 wanted 가 이깁니다. 구현과 같은 식을 다시 쓰지 않고 숫자로 못박습니다.
    const [first, second] = nodes;
    expect((first!.y + second!.y) / 2).toBeCloseTo(areaCenterY);
    expect(second!.y - first!.y).toBeCloseTo(37.5);
  });

  it('SUB_SCALE 가 커도 빈 줄을 접은 poster 의 간격은 부 줄 크기에 끌려가지 않습니다', () => {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('MODE', 'poster');
    options.set('PAD_BOTTOM', 420);
    options.set('FONT_SIZE', 26);
    options.set('SUB_SCALE', 2.6);
    const nodes = textNodes(matteLayout(input({ options }), services).nodes);
    expect(nodes).toHaveLength(2);
    // poster 프리셋이 쓰는 값입니다. 두 줄 모두 26 이므로 간격은
    // max(26*1.25, 16.12+16.12) = 32.5 입니다. 부 줄 크기 67.6 이 끼어들면 58.032 가 되어
    // 그리지도 않는 줄이 배치를 넓혀 버립니다.
    expect(nodes[1]!.y - nodes[0]!.y).toBeCloseTo(32.5);
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

describe('matteLayout 로고', () => {
  // 기본값에서의 손 계산입니다. FONT_SIZE 30 이므로 markHeight = 36, ruleWidth = 1.8,
  // markGap = 10.8 입니다. 아래 여백 200 의 한가운데는 areaCenterY = 60 + 1000 + 100 =
  // 1160 이고 마크의 위끝은 1160 - 18 = 1142 입니다.
  //
  // 그려질 폭은 브랜드마다 다릅니다. 높이를 markHeight 로 못박고 폭이 가로세로 비를
  // 따르기 때문입니다. 니콘(512x512)은 36, 소니(512x90)는 36 * 512/90 = 204.8 입니다.
  // 예약하는 폭은 그 폭에 좌우 간격과 구분선을 더한 값입니다.
  const withLogo: LayoutServices = { ...services, hasLogo: () => true };
  const GAP_NIKON = 36 + 10.8 * 2 + 1.8;
  const GAP_SONY = 204.8 + 10.8 * 2 + 1.8;

  function withShowLogo(extra: Record<string, string | number | boolean> = {}) {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('LOGO_SOURCE', 'body');
    for (const [key, value] of Object.entries(extra)) options.set(key, value);
    return options;
  }

  const leftTextX = (nodes: SceneNode[], needle: string) =>
    textNodes(nodes).find((n) => n.style.align === 'left' && n.text.includes(needle))?.x;

  it('LOGO_SOURCE 기본이 없음이라 로고도 구분선도 워드마크도 그리지 않습니다', () => {
    const scene = matteLayout(input({ logoId: 'nikon' }), withLogo);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
    expect(scene.nodes.some((n) => n.kind === 'rect')).toBe(false);
    expect(textNodes(scene.nodes).map((n) => n.text)).not.toContain('Canon');
  });

  it('LOGO_SOURCE 를 바디로 두고 로고가 있으면 logo 노드를 만듭니다', () => {
    const scene = matteLayout(input({ options: withShowLogo(), logoId: 'nikon' }), withLogo);
    expect(scene.nodes.find((n) => n.kind === 'logo')).toMatchObject({ logoId: 'nikon' });
  });

  it('기본값(LOGO_SIDE left)에서 마크가 왼쪽 슬롯의 글 앞에 섭니다', () => {
    // 여백 액자에서 좌우로 나뉘는 배치는 polaroid 하나뿐이고 그것이 장비를 왼쪽에
    // 둡니다. 그래서 하단 바와 달리 왼쪽이 기본입니다.
    const scene = matteLayout(input({ options: withShowLogo(), logoId: 'nikon' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    // 마크의 왼쪽 끝이 곧 안쪽 여백 60 입니다. 그림을 상자 안에서 가운데로 밀어 넣던
    // 시절의 치우침이 없어졌습니다. 니콘은 정사각형이라 36x36 그대로입니다.
    expect(logo?.x).toBeCloseTo(60, 9);
    expect(logo?.y).toBeCloseTo(1142, 9);
    expect(logo?.w).toBeCloseTo(36, 9);
    expect(logo?.h).toBeCloseTo(36, 9);
    expect(leftTextX(scene.nodes, 'EOS')).toBeCloseTo(60 + GAP_NIKON, 9);
  });

  it('LOGO_SIDE 를 right 로 두면 오른쪽 덩어리의 왼쪽에 섭니다', () => {
    const options = withShowLogo({ LOGO_SIDE: 'right' });
    const scene = matteLayout(input({ options, logoId: 'nikon' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    // 오른쪽 글은 '50mm' 한 줄이고 목 측정기로 4 * 30 * 0.5 = 60 입니다. 오른쪽 끝
    // 1560 에서 60 을 물러난 1500 이 덩어리의 시작이라 마크는 1500 - GAP_NIKON 에 섭니다.
    expect(logo?.x).toBeCloseTo(1500 - GAP_NIKON, 9);
    // 왼쪽 슬롯은 마크가 붙지 않으므로 안쪽 여백에 그대로 있습니다.
    expect(leftTextX(scene.nodes, 'EOS')).toBe(60);
  });

  it('로고와 글 사이에 세로 구분선을 긋습니다', () => {
    const scene = matteLayout(input({ options: withShowLogo(), logoId: 'sony' }), withLogo);
    const rule = scene.nodes.find((n) => n.kind === 'rect');
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    // 폭이 높이보다 훨씬 얇아야 선으로 보입니다. 1.8 대 36 입니다.
    expect(rule?.w).toBeCloseTo(1.8, 9);
    expect(rule?.h).toBeCloseTo(36, 9);
    // 소니는 가로가 길어 상자를 꽉 채우므로 로고의 오른쪽 끝이 곧 상자의 오른쪽 끝입니다.
    expect(rule?.x).toBeGreaterThan((logo?.x ?? 0) + (logo?.w ?? 0));
    // 오른쪽 글 덩어리의 왼쪽 끝은 1560 - 60 = 1500 입니다.
    expect((rule?.x ?? 0) + (rule?.w ?? 0)).toBeLessThan(1500);
  });

  it('기본값에서는 로고를 켜고 꺼도 오른쪽 글줄의 기준점이 움직이지 않습니다', () => {
    // 마크가 왼쪽 슬롯에 붙으므로 오른쪽 슬롯은 안쪽 여백에 그대로 있습니다. 마크 자리는
    // 두 슬롯 사이에서 빠집니다.
    const rightX = (nodes: SceneNode[]) =>
      textNodes(nodes).find((n) => n.style.align === 'right')?.x;
    const on = matteLayout(input({ options: withShowLogo(), logoId: 'sony' }), withLogo);
    const off = matteLayout(input({ logoId: 'sony' }), withLogo);
    expect(rightX(on.nodes)).toBe(1560);
    expect(rightX(off.nodes)).toBe(1560);
  });

  it('로고와 워드마크가 저마다 그려질 폭만큼만 자리를 잡습니다', () => {
    // 한때는 둘의 폭을 같은 상자에 묶어 두었습니다. 그 탓에 가로로 긴 워드마크가 상자
    // 폭에 먼저 걸려 높이가 뭉개졌습니다. 지금은 각자 그려질 폭을 그대로 예약합니다.
    const options = withShowLogo();
    const real = matteLayout(input({ options, logoId: 'sony' }), withLogo);
    // services.hasLogo 가 거짓을 돌려주는 자리입니다. 실제로는 로고 데이터에 없는
    // 브랜드에서 이 갈래로 떨어집니다.
    const word = matteLayout(input({ options, logoId: 'sony' }), services);
    expect(leftTextX(real.nodes, 'EOS')).toBeCloseTo(60 + GAP_SONY, 9);
    // 워드마크는 'Canon' 다섯 글자이고 글자 크기가 36 * 0.45 = 16.2 이므로 목 측정기로
    // 5 * 16.2 * 0.5 = 40.5 입니다.
    expect(leftTextX(word.nodes, 'EOS')).toBeCloseTo(60 + 40.5 + 10.8 * 2 + 1.8, 9);
  });

  it('로고 높이가 브랜드와 무관하게 일정하고 폭만 가로세로 비를 따릅니다', () => {
    // 니콘은 정사각형이고 소니는 5.69 대 1 이지만 둘 다 높이가 markHeight 입니다. 높이가
    // 일정해야 옆 글자와 나란히 읽힙니다.
    const options = withShowLogo();
    const square = matteLayout(input({ options, logoId: 'nikon' }), withLogo);
    const wide = matteLayout(input({ options, logoId: 'sony' }), withLogo);
    expect(square.nodes.find((n) => n.kind === 'logo')).toMatchObject({ w: 36, h: 36 });
    expect(wide.nodes.find((n) => n.kind === 'logo')?.h).toBeCloseTo(36, 9);
    expect(wide.nodes.find((n) => n.kind === 'logo')?.w).toBeCloseTo(204.8, 9);
  });

  it('폭 상한을 넘는 로고만 높이를 내주고 그만큼 세로 가운데로 옵니다', () => {
    // 핫셀블라드는 512x40 으로 12.8 대 1 이라 상한 6 에 걸립니다. 폭이 36 * 6 = 216 으로
    // 묶이고 높이는 216 / 12.8 = 16.875 로 줄며, 남는 세로를 위아래로 반씩 나눕니다.
    const options = withShowLogo();
    const flat = matteLayout(input({ options, logoId: 'hasselblad' }), withLogo);
    const logo = flat.nodes.find((n) => n.kind === 'logo');
    expect(logo?.w).toBeCloseTo(216, 9);
    expect(logo?.h).toBeCloseTo(16.875, 9);
    expect(logo?.y).toBeCloseTo(1142 + (36 - 16.875) / 2, 9);
    // 세로 가운데는 다른 브랜드와 같은 자리입니다.
    expect((logo?.y ?? 0) + (logo?.h ?? 0) / 2).toBeCloseTo(1160, 9);
  });

  it('오른쪽 슬롯의 글 폭이 마크 자리만큼 줄어듭니다', () => {
    // 줄지 않으면 긴 글이 마크 자리를 침범합니다. half 는
    // (1500 - 77.4)/2 - 30 = 681.3 이고, 목 측정기로 30 크기 한 글자가 15 입니다.
    const options = withShowLogo({ SECONDARY_MAIN: 'X'.repeat(200) });
    const scene = matteLayout(input({ options, logoId: 'sony' }), withLogo);
    const right = textNodes(scene.nodes).find((n) => n.style.align === 'right');
    expect(right?.text.endsWith('…')).toBe(true);
    expect(services.measureText(right?.text ?? '', right!.style)).toBeLessThanOrEqual(681.3);
  });

  it('single 에서 마크와 글을 한 덩어리로 보고 가운데에 놓습니다', () => {
    const options = withShowLogo({ MODE: 'single', ALIGN: 'center', PRIMARY_MAIN: 'ABC' });
    const scene = matteLayout(input({ options, logoId: 'sony' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    const text = textNodes(scene.nodes)[0];
    expect(text?.text).toBe('ABC');
    // 목 측정기로 'ABC' 는 3 * 30 * 0.5 = 45 입니다. 덩어리 폭은 GAP_SONY + 45 이고
    // 왼쪽 끝은 (1620 - 덩어리 폭)/2 입니다. 글은 그 뒤 GAP_SONY 부터이고 가운데
    // 정렬이라 다시 절반을 더합니다.
    const blockLeft = (1620 - (GAP_SONY + 45)) / 2;
    expect(logo?.x).toBeCloseTo(blockLeft, 9);
    expect(text?.x).toBeCloseTo(blockLeft + GAP_SONY + 22.5, 9);
  });

  it('poster 에서 마크가 쌓인 글 전체의 왼쪽에 서고 어느 줄과도 겹치지 않습니다', () => {
    const options = withShowLogo({ MODE: 'poster', ALIGN: 'left', PRIMARY_SUB: '여름의 끝' });
    const scene = matteLayout(input({ options, logoId: 'sony' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    const rule = scene.nodes.find((n) => n.kind === 'rect');
    const lines = textNodes(scene.nodes);
    expect(lines).toHaveLength(3);
    expect(logo?.x).toBeCloseTo(60, 9);
    for (const line of lines) {
      expect(line.x).toBeCloseTo(60 + GAP_SONY, 9);
      expect(line.x).toBeGreaterThan((rule?.x ?? 0) + (rule?.w ?? 0));
    }
    // 마크의 세로 가운데가 쌓인 글의 가운데와 같습니다.
    expect((logo?.y ?? 0) + (logo?.h ?? 0) / 2).toBeCloseTo(1160, 9);
  });

  it('아래 여백이 0 이면 마크가 통째로 빠지고 글 기준점도 움직이지 않습니다', () => {
    // 글이 없는데 마크만 사진 위에 떠 있으면 안 됩니다. 예약하는 폭도 함께 0 이 됩니다.
    const options = withShowLogo({ PAD_BOTTOM: 0, LOGO_SIDE: 'left' });
    const scene = matteLayout(input({ options, logoId: 'sony' }), withLogo);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
    expect(scene.nodes.some((n) => n.kind === 'rect')).toBe(false);
    expect(leftTextX(scene.nodes, 'EOS')).toBe(60);
  });

  it('아래 여백을 좁혀도 마크가 사진 위로 올라가지 않습니다', () => {
    // 상자 높이가 아래 여백에 묶입니다. 여백 20 이면 상자도 20 이라 위끝이 사진
    // 아래변(60 + 1000 = 1060)에 정확히 닿고 아래끝이 캔버스 바닥(1080)에 닿습니다.
    const options = withShowLogo({ PAD_BOTTOM: 20, LOGO_SIDE: 'left' });
    const scene = matteLayout(input({ options, logoId: 'nikon' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    const rule = scene.nodes.find((n) => n.kind === 'rect');
    const EPSILON = 1e-9;
    expect(rule?.y).toBeCloseTo(1060, 9);
    expect((rule?.y ?? 0) + (rule?.h ?? 0)).toBeCloseTo(1080, 9);
    expect(logo?.y ?? 0).toBeGreaterThanOrEqual(1060 - EPSILON);
    expect((logo?.y ?? 0) + (logo?.h ?? 0)).toBeLessThanOrEqual(1080 + EPSILON);
  });

  it('로고와 구분선에 TEXT_COLOR 를 실어 보냅니다', () => {
    // 그리는 쪽이 물들일 색입니다. 물들이지 않는 로고는 이 값을 쓰지 않습니다.
    const options = withShowLogo({ TEXT_COLOR: '#222222' });
    const scene = matteLayout(input({ options, logoId: 'sony' }), withLogo);
    expect(scene.nodes.find((n) => n.kind === 'logo')?.fill).toBe('#222222');
    expect(scene.nodes.find((n) => n.kind === 'rect')?.fill).toBe('#222222');
  });
});

describe('matteLayout 워드마크 폴백', () => {
  function withShowLogo(extra: Record<string, string | number | boolean> = {}) {
    const options = defaultValues(MATTE_OPTIONS);
    options.set('LOGO_SOURCE', 'body');
    options.set('LOGO_SIDE', 'left');
    for (const [key, value] of Object.entries(extra)) options.set(key, value);
    return options;
  }

  it('그 브랜드의 로고가 없으면 브랜드 이름을 상자 자리에 글자로 그립니다', () => {
    const scene = matteLayout(input({ options: withShowLogo(), logoId: 'sony' }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
    // 상자의 왼쪽 끝이 안쪽 여백(60)에 못박히고 PRIMARY 는 예약한 폭만큼 더 들어간
    // 137.4 에 놓이므로, 둘 다 align 이 left 라도 좌표로 갈립니다.
    const wordmark = textNodes(scene.nodes).find((n) => n.x === 60);
    expect(wordmark?.text).toBe('Canon');
    // 크기는 상자 높이의 0.45 배입니다. 36 * 0.45 = 16.2 입니다.
    expect(wordmark?.style.size).toBeCloseTo(16.2, 9);
  });

  it('브랜드 이름이 상자 폭을 넘으면 줄입니다', () => {
    const scene = matteLayout(
      input({ options: withShowLogo(), logoId: 'sony', fields: { MAKER: '가'.repeat(200) } }),
      services,
    );
    const wordmark = textNodes(scene.nodes).find((n) => n.x === 60);
    expect(wordmark?.text.endsWith('…')).toBe(true);
  });

  it('MAKER 가 없으면 로고 id 가 있어도 워드마크도 구분선도 그리지 않습니다', () => {
    const scene = matteLayout(input({ options: withShowLogo(), logoId: 'sony', fields: {} }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
    expect(scene.nodes.some((n) => n.kind === 'rect')).toBe(false);
    expect(textNodes(scene.nodes)).toHaveLength(0);
  });
});
