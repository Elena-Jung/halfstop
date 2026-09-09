import { describe, expect, it } from 'vitest';
import { INFO_BAR_OPTIONS, infoBarLayout } from './infoBar';
import { defaultValues } from '../options';
import type { LayoutInput, LayoutServices, SceneNode } from '../types';

const services: LayoutServices = {
  measureText: (text, style) => text.length * style.size * 0.5,
  hasLogo: () => false,
};

function input(overrides: Partial<LayoutInput> = {}): LayoutInput {
  return {
    photo: { width: 1500, height: 1000 },
    fields: { MAKER: 'Nikon', BODY: 'Z 6II', MM: '35mm', F: 'f/1.8', SEC: '1/250s', ISO: 'ISO 400' },
    logoId: undefined,
    options: defaultValues(INFO_BAR_OPTIONS),
    ...overrides,
  };
}

function texts(nodes: SceneNode[]): string[] {
  return nodes.filter((n) => n.kind === 'text').map((n) => n.text);
}

describe('infoBarLayout', () => {
  it('사진 아래에 바 높이만큼 캔버스를 늘립니다', () => {
    const scene = infoBarLayout(input(), services);
    expect(scene.width).toBe(1500);
    expect(scene.height).toBe(1000 + 120);
  });

  it('사진을 원점에 원본 크기로 놓습니다', () => {
    const scene = infoBarLayout(input(), services);
    const image = scene.nodes.find((n) => n.kind === 'image');
    expect(image).toEqual({ kind: 'image', x: 0, y: 0, w: 1500, h: 1000 });
  });

  it('좌우 두 줄의 텍스트를 만듭니다', () => {
    const scene = infoBarLayout(input(), services);
    expect(texts(scene.nodes)).toEqual(['Nikon · Z 6II', '35mm · f/1.8 · 1/250s · ISO 400']);
  });

  it('값이 없으면 그 텍스트 노드를 아예 만들지 않습니다', () => {
    const scene = infoBarLayout(input({ fields: { MAKER: 'Nikon', BODY: 'Z 6II' } }), services);
    expect(texts(scene.nodes)).toEqual(['Nikon · Z 6II']);
  });

  it('배경색 옵션이 Scene 배경에 반영됩니다', () => {
    const options = defaultValues(INFO_BAR_OPTIONS);
    options.set('BACKGROUND', '#000000');
    const scene = infoBarLayout(input({ options }), services);
    expect(scene.background).toBe('#000000');
  });

  it('바 높이 옵션이 캔버스 높이에 반영됩니다', () => {
    const options = defaultValues(INFO_BAR_OPTIONS);
    options.set('BAR_HEIGHT', 300);
    const scene = infoBarLayout(input({ options }), services);
    expect(scene.height).toBe(1300);
  });

  it('로고가 있으면 logo 노드를 만듭니다', () => {
    const withLogo: LayoutServices = { ...services, hasLogo: () => true };
    const scene = infoBarLayout(input({ logoId: 'nikon' }), withLogo);
    const logo = scene.nodes.find((n) => n.kind === 'logo');
    expect(logo).toMatchObject({ kind: 'logo', logoId: 'nikon' });
  });

  it('로고가 없으면 logo 노드를 만들지 않습니다', () => {
    const scene = infoBarLayout(input({ logoId: 'nikon' }), services);
    expect(scene.nodes.some((n) => n.kind === 'logo')).toBe(false);
  });

  it('기본 서체는 Inter입니다', () => {
    const scene = infoBarLayout(input(), services);
    const text = scene.nodes.find((n) => n.kind === 'text');
    expect(text?.style.family).toContain('Inter');
  });

  it('서체 옵션을 바꾸면 텍스트 스타일이 따라갑니다', () => {
    const options = defaultValues(INFO_BAR_OPTIONS);
    options.set('FONT_FAMILY', 'jetbrains-mono');
    const scene = infoBarLayout(input({ options }), services);
    const text = scene.nodes.find((n) => n.kind === 'text');
    expect(text?.style.family).toContain('JetBrains');
  });

  it('사진 크기가 달라도 같은 옵션이면 바 높이 비율이 같습니다', () => {
    const wide = infoBarLayout(input({ photo: { width: 3000, height: 1000 } }), services);
    const square = infoBarLayout(input({ photo: { width: 1000, height: 1000 } }), services);
    expect(wide.height - 1000).toBe(square.height - 1000);
  });
});
