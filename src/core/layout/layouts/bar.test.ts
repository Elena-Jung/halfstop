import { describe, expect, it } from 'vitest';
import { BAR_OPTIONS, barLayout } from './bar';
import { ARRANGEMENTS } from '../arrangements';
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
    expect(scene.height).toBe(1000 + 102);
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
    // BAR_HEIGHT 102 기본값: footerHeight 32.64, slotHeight 69.36, slotCenterY 1034.68.
    // 큰 쪽 글자의 반높이 두 개가 34*1.24=42.16 이므로 gap 은 원하는 42.5 가 아니라
    // 69.36-42.16=27.2 로 좁혀집니다. 그 결과 주 줄의 글자 상단이 정확히 1000, 즉 사진
    // 경계에 맞닿습니다.
    expect(main?.y).toBeCloseTo(1021.08);
    expect(sub?.y).toBeCloseTo(1048.28);
    expect(footer?.y).toBeCloseTo(1085.68);
    // 앵커가 아니라 글자 상단으로 확인합니다. 앵커만 보면 글자가 사진을 덮어도 통과합니다.
    // 주 줄은 경계에 정확히 맞닿으므로 이진 부동소수점에서 1000 을 머리카락만큼 밑돕니다.
    const EPSILON = 1e-9;
    expect((main?.y ?? 0) - halfHeight(34)).toBeGreaterThanOrEqual(1000 - EPSILON);
    expect((sub?.y ?? 0) - halfHeight(23.8)).toBeGreaterThanOrEqual(1000 - EPSILON);
    // 부 줄과 꼬리 줄은 둘 다 글자 크기가 23.8이므로, 반높이의 합(23.8*0.62*2)
    // 이상 떨어져 있어야 겹치지 않습니다.
    expect((footer?.y ?? 0) - (sub?.y ?? 0)).toBeGreaterThanOrEqual(halfHeight(23.8) * 2);
  });

  it('슬롯이 한 줄보다 좁아지면 글자를 슬롯에 맞춰 줄입니다', () => {
    const options = defaultValues(BAR_OPTIONS);
    options.set('BAR_HEIGHT', 60);
    options.set('PRIMARY_SUB', '{LENS}');
    options.set('FOOTER', '{ISO}');
    const scene = barLayout(input({ options }), services);
    const nodes = textNodes(scene.nodes);
    expect(nodes.length).toBe(4);
    const main = nodes.find((n) => n.text === 'Canon · EOS R6');
    const sub = nodes.find((n) => n.text === 'RF 50mm');
    // slotHeight 는 60 - 60*0.32 = 40.8 입니다. 34 크기 글자 한 줄이 위아래로 차지하는
    // 높이가 34*0.62*2 = 42.16 이라 두 줄을 넣을 자리가 애초에 없습니다. 간격을 0 까지
    // 좁혀도 글자가 사진을 덮으므로, 슬롯에 딱 들어가는 크기 40.8/1.24 = 32.9032... 로
    // 줄입니다. 부 줄은 SUB_SCALE 0.7 을 유지해 32.9032... * 0.7 = 23.0323... 입니다.
    expect(main?.style.size).toBeCloseTo(32.9032, 4);
    expect(sub?.style.size).toBeCloseTo(23.0323, 4);
    // 두 줄이 슬롯을 꽉 채우므로 간격은 0 이고 둘 다 슬롯 가운데에 놓입니다.
    expect(main?.y).toBeCloseTo(1020.4);
    expect(sub?.y).toBeCloseTo(1020.4);
    // 줄인 결과 주 줄의 글자 위끝이 사진 아래변에 정확히 닿습니다. 예전에는 같은 조합에서
    // 999.32 로 사진을 0.68 만큼 덮었습니다.
    expect((main?.y ?? 0) - halfHeight(main?.style.size ?? 0)).toBeCloseTo(1000);
  });

  it('바 높이를 최소까지 내려도 글자가 사진을 덮지 않습니다', () => {
    // 예전에는 기본 글자 크기 34 에서 7.48u 를 덮었습니다. 슬라이더로 닿을 수 있는
    // 가장 나쁜 자리입니다.
    const options = defaultValues(BAR_OPTIONS);
    options.set('BAR_HEIGHT', 40);
    options.set('PRIMARY_SUB', '{LENS}');
    options.set('FOOTER', '{ISO}');
    const scene = barLayout(input({ options }), services);
    const tops = textNodes(scene.nodes).map((n) => n.y - halfHeight(n.style.size));
    expect(Math.min(...tops)).toBeGreaterThanOrEqual(1000 - 1e-9);
  });
});

describe('barLayout 글자가 사진을 덮지 않는 불변식', () => {
  // 한두 사례만 찍으면 구멍이 남으므로 조합을 훑습니다. 바 높이는 옵션 선언의 최소부터
  // 최대까지, 글자 크기와 부 줄 비율은 그 범위의 끝과 가운데를, 배치는 bar 에서 쓸 수
  // 있는 것 전부를, 로고 표시는 켜고 끈 두 경우를 돌립니다.
  const PHOTO_HEIGHT = 1000;
  const BAR_HEIGHTS = [40, 41, 45, 55, 60, 80, 90, 100, 120, 140, 160, 170, 200, 260, 330, 420, 500];
  const FONT_SIZES = [8, 12, 24, 28, 30, 34, 40, 60, 90, 120];
  const SUB_SCALES = [0.4, 0.55, 0.7, 0.85, 1];

  const barArrangements = ARRANGEMENTS.filter((a) => a.layouts.includes('bar'));

  const sweepFields: LayoutInput['fields'] = {
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

  it('어떤 조합에서도 글자 위끝이 사진 아래변보다 위로 올라가지 않습니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const violations: string[] = [];
    let tightest = Infinity;
    let combinations = 0;

    for (const arrangement of barArrangements) {
      for (const barHeight of BAR_HEIGHTS) {
        for (const fontSize of FONT_SIZES) {
          for (const subScale of SUB_SCALES) {
            for (const showLogo of [false, true]) {
              combinations += 1;
              const options = defaultValues(BAR_OPTIONS);
              for (const [key, value] of Object.entries(arrangement.values)) options.set(key, value);
              options.set('BAR_HEIGHT', barHeight);
              options.set('FONT_SIZE', fontSize);
              options.set('SUB_SCALE', subScale);
              options.set('SHOW_LOGO', showLogo);

              const scene = barLayout(
                input({ options, fields: sweepFields, logoId: 'sony' }),
                showLogo ? withLogo : services,
              );

              for (const node of textNodes(scene.nodes)) {
                // 앵커가 아니라 글자 위끝으로 봅니다. 중심선이 사진 아래에 있어도 글자
                // 윗부분은 사진을 덮을 수 있습니다.
                const top = node.y - halfHeight(node.style.size);
                tightest = Math.min(tightest, top - PHOTO_HEIGHT);
                if (top < PHOTO_HEIGHT - 1e-9) {
                  violations.push(
                    `${arrangement.id} 바 ${barHeight} 글자 ${fontSize} 부 ${subScale} 로고 ${showLogo}: 위끝 ${top}`,
                  );
                }
              }
            }
          }
        }
      }
    }

    expect(combinations).toBe(barArrangements.length * 17 * 10 * 5 * 2);
    expect(violations.slice(0, 10)).toEqual([]);
    // 딱 맞닿는 조합이 실제로 훑혔는지 봅니다. 여유가 남기만 하면 이 검사는 헐거운
    // 조합만 돌고도 통과할 수 있습니다.
    expect(tightest).toBeLessThan(1e-6);
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

describe('barLayout 로고 자리', () => {
  // 기본값에서의 손 계산입니다. BAR_HEIGHT 102 이므로
  // logoWidth = 61.2, logoHeight = 40.8, ruleWidth = 2.04, markGap = 61.2*0.2 = 12.24,
  // logoGap = 61.2 + 12.24*2 + 2.04 = 87.72 입니다.
  const withLogo: LayoutServices = { ...services, hasLogo: () => true };
  const LOGO_GAP = 87.72;

  function withShowLogo(extra: Record<string, string | number | boolean> = {}) {
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    for (const [key, value] of Object.entries(extra)) options.set(key, value);
    return options;
  }

  it('기본값(LOGO_SIDE right)에서 로고가 오른쪽 슬롯의 글 덩어리 왼쪽에 붙습니다', () => {
    const options = withShowLogo();
    const scene = barLayout(input({ options, logoId: 'sony' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    const secondary = textNodes(scene.nodes).find((n) => n.style.align === 'right');
    expect(logo).toBeDefined();
    expect(secondary).toBeDefined();
    // 오른쪽 글은 끝(photoWidth - SIDE_PADDING = 1440)에 맞춰 있고, 잰 폭만큼 왼쪽이
    // 덩어리의 시작입니다. 로고 상자는 그보다 logoGap 만큼 더 왼쪽에 섭니다.
    const blockWidth = services.measureText(secondary!.text, secondary!.style);
    expect(logo!.x).toBeCloseTo(1440 - blockWidth - LOGO_GAP, 9);
  });

  it('로고와 장비명 사이에 세로 구분선을 긋습니다', () => {
    const options = withShowLogo();
    const scene = barLayout(input({ options, logoId: 'sony' }), withLogo);
    const rule = scene.nodes.find((n) => n.kind === 'rect');
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    const secondary = textNodes(scene.nodes).find((n) => n.style.align === 'right');
    expect(rule).toBeDefined();
    // 폭이 높이보다 훨씬 얇아야 선으로 보입니다. 2.04 대 40.8 입니다.
    expect(rule!.w).toBeCloseTo(2.04, 9);
    expect(rule!.h).toBeCloseTo(40.8, 9);
    // 로고와 글 사이에 있습니다. 소니는 가로가 길어 상자를 꽉 채우므로 로고의 오른쪽
    // 끝이 곧 상자의 오른쪽 끝입니다.
    const blockLeft = 1440 - services.measureText(secondary!.text, secondary!.style);
    expect(rule!.x).toBeGreaterThan(logo!.x + logo!.w);
    expect(rule!.x + rule!.w).toBeLessThan(blockLeft);
  });

  it('LOGO_SIDE 를 left 로 두면 왼쪽 슬롯에 붙고 그쪽 글이 밀립니다', () => {
    const options = withShowLogo({ LOGO_SIDE: 'left' });
    const scene = barLayout(input({ options, logoId: 'sony' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    const primary = textNodes(scene.nodes).find((n) => n.style.align === 'left');
    expect(logo!.x).toBeCloseTo(60, 9);
    expect(primary!.x).toBeCloseTo(60 + LOGO_GAP, 9);
  });

  it('로고는 상자 안에서 PNG 의 가로세로 비대로 가운데 정렬됩니다', () => {
    // 니콘 PNG 는 512x512 정사각형입니다. 상자가 61.2 x 40.8 이라 높이에 맞춰 40.8x40.8
    // 이 되고, 남는 가로 20.4 를 절반씩 나눠 왼쪽에 10.2 가 붙습니다.
    const options = withShowLogo({ LOGO_SIDE: 'left' });
    const scene = barLayout(input({ options, logoId: 'nikon' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    expect(logo!.w).toBeCloseTo(40.8, 9);
    expect(logo!.h).toBeCloseTo(40.8, 9);
    expect(logo!.x).toBeCloseTo(70.2, 9);
    // 세로는 남는 곳이 없어 상자 위끝 그대로입니다. 슬롯 가운데 1051 에서 20.4 위입니다.
    expect(logo!.y).toBeCloseTo(1030.6, 9);
  });

  it('브랜드가 달라도 예약하는 폭은 같아 옆 글줄이 흔들리지 않습니다', () => {
    // 핫셀블라드는 512x40 으로 아주 납작하고 니콘은 정사각형이라, 그려지는 크기가
    // 크게 다릅니다. 상자가 그림을 따라가면 브랜드를 바꿀 때마다 글이 출렁입니다.
    const options = withShowLogo({ LOGO_SIDE: 'left' });
    const flat = barLayout(input({ options, logoId: 'hasselblad' }), withLogo);
    const square = barLayout(input({ options, logoId: 'nikon' }), withLogo);
    const leftText = (scene: { nodes: SceneNode[] }) =>
      textNodes(scene.nodes).find((n) => n.style.align === 'left')?.x;
    expect(leftText(flat)).toBe(leftText(square));
    expect(flat.nodes.find((n) => n.kind === 'rect')?.x).toBe(
      square.nodes.find((n) => n.kind === 'rect')?.x,
    );
  });

  it('기본값에서는 로고를 켜고 꺼도 왼쪽 글줄의 기준점이 움직이지 않습니다', () => {
    // 로고가 오른쪽 슬롯에 붙으므로 왼쪽 슬롯은 SIDE_PADDING 에 그대로 있습니다.
    const on = barLayout(input({ options: withShowLogo(), logoId: 'sony' }), withLogo);
    const off = barLayout(input({ logoId: 'sony' }), withLogo);
    const leftX = (scene: { nodes: SceneNode[] }) =>
      textNodes(scene.nodes).find((n) => n.style.align === 'left')?.x;
    expect(leftX(on)).toBe(60);
    expect(leftX(off)).toBe(60);
  });

  it('로고에 TEXT_COLOR 를 실어 보냅니다', () => {
    // 그리는 쪽이 물들일 색입니다. 물들이지 않는 로고는 이 값을 쓰지 않습니다.
    const options = withShowLogo({ TEXT_COLOR: '#222222' });
    const scene = barLayout(input({ options, logoId: 'sony' }), withLogo);
    expect(scene.nodes.find((n) => n.kind === 'logo')?.fill).toBe('#222222');
  });

  it('MODE single 에서도 로고는 한 덩어리의 왼쪽에 붙고 덩어리째 가운데에 놓입니다', () => {
    const options = withShowLogo({ MODE: 'single', ALIGN: 'center', PRIMARY_MAIN: 'ABC' });
    const scene = barLayout(input({ options, logoId: 'sony' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    const text = textNodes(scene.nodes)[0];
    expect(text?.text).toBe('ABC');
    // 목 측정기로 'ABC' 는 3 * 34 * 0.5 = 51 입니다. 덩어리 폭은 87.72 + 51 = 138.72 이고
    // 왼쪽 끝은 (1500 - 138.72)/2 = 680.64 입니다. 글은 그 뒤 87.72 부터라 가운데가
    // 680.64 + 87.72 + 25.5 = 793.86 입니다.
    expect(logo?.x).toBeCloseTo(680.64, 9);
    expect(text?.x).toBeCloseTo(793.86, 9);
  });

  it('로고를 켜지 않으면 구분선도 긋지 않습니다', () => {
    const scene = barLayout(input({ logoId: 'sony' }), withLogo);
    expect(scene.nodes.some((n) => n.kind === 'rect')).toBe(false);
  });

  it('로고 상자의 폭만큼 오른쪽 슬롯의 글 폭이 줄어듭니다', () => {
    // 줄지 않으면 긴 글이 로고 자리를 침범합니다. half 는
    // (1500 - 120 - 87.72)/2 - 15 = 631.14 이고, 목 측정기로 34px 한 글자가 17 이라
    // 631.14 / 17 = 37.1 글자까지 들어갑니다.
    const options = withShowLogo({ MODE: 'split', SECONDARY_MAIN: 'X'.repeat(200) });
    const scene = barLayout(input({ options, logoId: 'sony' }), withLogo);
    const secondary = textNodes(scene.nodes).find((n) => n.style.align === 'right');
    expect(secondary!.text.endsWith('…')).toBe(true);
    expect(services.measureText(secondary!.text, secondary!.style)).toBeLessThanOrEqual(631.14);
  });
});

describe('barLayout 워드마크 폴백', () => {
  // 워드마크 크기는 logoHeight * 0.45 입니다. 기본 BAR_HEIGHT 102 에서
  // logoHeight = 40.8 이므로 size = 18.36 입니다. 이 목(mock) 측정기(글자당 size*0.5)로는
  // 'ABC' 석 자가 3*18.36*0.5 = 27.54 가 되어 logoWidth(61.2)에 여유 있게 들어갑니다.
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
    // services.hasLogo 가 거짓을 돌려주는 자리입니다. 실제로는 로고 데이터에 없는
    // 브랜드(코닥 같은)에서 이 갈래로 떨어집니다.
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    const scene = barLayout(input({ options, logoId: 'canon', fields: shortMakerFields }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
    expect(texts(scene.nodes)).toContain('ABC');
  });

  it('워드마크는 로고 상자와 같은 자리에 놓입니다', () => {
    // LOGO_SIDE 를 left 로 두면 상자의 왼쪽 끝이 SIDE_PADDING(60)에 못박힙니다.
    // 오른쪽에 붙일 때는 상자의 자리가 글 길이를 따라 움직여 좌표로 가릴 수 없습니다.
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    options.set('LOGO_SIDE', 'left');

    const withWordmark = barLayout(input({ options, logoId: 'canon', fields: shortMakerFields }), services);
    // PRIMARY 슬롯도 align:'left' 라 텍스트만으로는 못 가릅니다. 워드마크는 상자의
    // 왼쪽 끝(60)에 놓이고 PRIMARY 는 예약한 폭만큼 더 들어간 x(60+87.72)에 놓이므로,
    // 좌표로 구분합니다.
    const wordmark = textNodes(withWordmark.nodes).find((n) => n.x === 60);

    expect(wordmark).toBeDefined();
    expect(wordmark?.text).toBe('ABC');
    expect(wordmark?.style.align).toBe('left');
  });

  it('로고와 워드마크가 예약하는 폭이 같아, 로고가 있고 없는 사진 사이에서 글이 흔들리지 않습니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const options = defaultValues(BAR_OPTIONS);
    options.set('SHOW_LOGO', true);
    // 왼쪽 슬롯에 붙여야 예약한 폭이 PRIMARY 의 x 로 드러납니다.
    options.set('LOGO_SIDE', 'left');

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
    options.set('LOGO_SIDE', 'left');
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
