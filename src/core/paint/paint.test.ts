import { describe, expect, it } from 'vitest';
import { paint, type PaintSources, type PaintTarget } from './paint';
import type { Scene } from '../layout/types';

/** 캔버스에 내려가는 명령을 순서대로 기록합니다. */
function recorder(): { ctx: PaintTarget; calls: string[] } {
  const calls: string[] = [];
  const log = (name: string, ...args: unknown[]) => calls.push(`${name}(${args.join(',')})`);
  const ctx = {
    save: () => log('save'),
    restore: () => log('restore'),
    scale: (x: number, y: number) => log('scale', x, y),
    translate: (x: number, y: number) => log('translate', x, y),
    fillRect: (x: number, y: number, w: number, h: number) => log('fillRect', x, y, w, h),
    fillText: (t: string, x: number, y: number) => log('fillText', t, x, y),
    drawImage: (_: unknown, x: number, y: number, w: number, h: number) => log('drawImage', x, y, w, h),
    fill: (path: unknown, rule?: unknown) => log('fill', String(path), String(rule)),
    set fillStyle(value: string) {
      log('set fillStyle', value);
    },
    set font(value: string) {
      log('set font', value);
    },
    set textAlign(value: string) {
      log('set textAlign', value);
    },
    set textBaseline(value: string) {
      log('set textBaseline', value);
    },
    set globalAlpha(value: number) {
      log('set globalAlpha', value);
    },
  } as unknown as PaintTarget;
  return { ctx, calls };
}

const sources: PaintSources = {
  photo: {} as CanvasImageSource,
  // 조각 둘을 서로 다른 채우기 규칙으로 돌려줍니다. 규칙이 조각을 따라가는지 봅니다.
  logo: (id) =>
    id === 'nikon'
      ? [
          { path: `path:${id}:0` as unknown as Path2D, fillRule: 'nonzero' as const },
          { path: `path:${id}:1` as unknown as Path2D, fillRule: 'evenodd' as const },
        ]
      : null,
};

const SCENE: Scene = {
  width: 1500,
  height: 1120,
  background: '#ffffff',
  nodes: [
    { kind: 'image', x: 0, y: 0, w: 1500, h: 1000 },
    { kind: 'rect', x: 0, y: 1000, w: 1500, h: 2, fill: '#dddddd', alpha: 0.5 },
    { kind: 'logo', x: 60, y: 1036, w: 72, h: 48, logoId: 'nikon', fill: '#111111' },
    {
      kind: 'text',
      x: 200,
      y: 1060,
      text: 'Nikon · Z 6II',
      style: {
        family: 'Inter',
        size: 34,
        weight: 400,
        style: 'normal',
        color: '#111111',
        align: 'left',
        baseline: 'middle',
        alpha: 1,
      },
    },
  ],
};

describe('paint', () => {
  it('배율만 다르면 scale 호출 하나를 빼고 명령이 완전히 같습니다', () => {
    const a = recorder();
    const b = recorder();
    paint(SCENE, a.ctx, 1, sources);
    paint(SCENE, b.ctx, 0.25, sources);

    // 맨 앞 scale 한 줄만 빼고 나머지는 전부 비교합니다. scale로 시작하는 명령을
    // 통째로 걸러내면 logo 분기 안의 scale까지 사라져, 거기에 pxPerUnit이 섞여
    // 들어가는 회귀를 놓칩니다. 인덱스 1은 save 다음의 최상위 scale입니다.
    const strip = (calls: string[]) => calls.filter((_, index) => index !== 1);
    expect(strip(a.calls)).toEqual(strip(b.calls));
    expect(a.calls).toContain('scale(1,1)');
    expect(b.calls).toContain('scale(0.25,0.25)');
  });

  it('배경을 먼저 칠합니다', () => {
    const { ctx, calls } = recorder();
    paint(SCENE, ctx, 1, sources);
    expect(calls[0]).toBe('save()');
    expect(calls[1]).toBe('scale(1,1)');
    expect(calls[2]).toBe('set fillStyle(#ffffff)');
    expect(calls[3]).toBe('fillRect(0,0,1500,1120)');
  });

  it('마지막에 상태를 되돌립니다', () => {
    const { ctx, calls } = recorder();
    paint(SCENE, ctx, 1, sources);
    expect(calls.at(-1)).toBe('restore()');
  });

  it('글꼴 크기를 디자인 단위 그대로 넘깁니다', () => {
    const { ctx, calls } = recorder();
    paint(SCENE, ctx, 0.25, sources);
    expect(calls).toContain('set font(normal 400 34px Inter)');
  });

  it('조각마다 그 조각의 채우기 규칙으로 칠합니다', () => {
    const { ctx, calls } = recorder();
    paint(SCENE, ctx, 1, sources);
    // 규칙을 넘기지 않으면 캔버스가 nonzero 로 칠하므로, evenodd 로 설계된 조각의
    // 속이 메워집니다. 규칙을 조각마다 넘기는지 명령 기록으로 못박습니다.
    expect(calls).toContain('fill(path:nikon:0,nonzero)');
    expect(calls).toContain('fill(path:nikon:1,evenodd)');
  });

  it('로고가 없으면 fill을 부르지 않습니다', () => {
    const { ctx, calls } = recorder();
    const noLogo: PaintSources = { ...sources, logo: () => null };
    paint(SCENE, ctx, 1, noLogo);
    expect(calls.some((c) => c.startsWith('fill(path'))).toBe(false);
  });
});
