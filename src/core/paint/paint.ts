import type { Scene, SceneNode } from '../layout/types';

/** 브라우저와 워커의 2D 컨텍스트가 모두 이 모양을 만족합니다. */
export type PaintTarget = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface PaintSources {
  photo: CanvasImageSource;
  /**
   * 그릴 준비가 끝난 로고 그림입니다. 아직 받아 오지 못했으면 null 입니다. fill 은
   * 물들여야 하는 로고에서 쓸 색이고, 부르는 쪽이 그 색으로 만들어 둔 그림을 돌려줍니다.
   */
  logo(logoId: string, fill: string): CanvasImageSource | null;
}

function paintNode(node: SceneNode, ctx: PaintTarget, sources: PaintSources): void {
  switch (node.kind) {
    case 'image':
      ctx.drawImage(sources.photo, node.x, node.y, node.w, node.h);
      return;

    case 'rect':
      ctx.globalAlpha = node.alpha;
      ctx.fillStyle = node.fill;
      ctx.fillRect(node.x, node.y, node.w, node.h);
      ctx.globalAlpha = 1;
      return;

    case 'text':
      ctx.globalAlpha = node.style.alpha;
      ctx.fillStyle = node.style.color;
      ctx.font = `${node.style.style} ${node.style.weight} ${node.style.size}px ${node.style.family}`;
      ctx.textAlign = node.style.align;
      ctx.textBaseline = node.style.baseline;
      ctx.fillText(node.text, node.x, node.y);
      ctx.globalAlpha = 1;
      return;

    case 'logo': {
      // node.fill 은 "실루엣을 칠할 색" 이 아니라 "물들여야 하는 로고라면 쓸 색" 입니다.
      // 니콘의 노란 상자처럼 색 자체가 뜻을 갖는 로고는 이 값을 쓰지 않고 원래 색
      // 그대로 나옵니다. 어느 쪽인지는 로고 데이터가 정합니다.
      const image = sources.logo(node.logoId, node.fill);
      if (!image) return;
      ctx.drawImage(image, node.x, node.y, node.w, node.h);
      return;
    }
  }
}

/**
 * pxPerUnit은 맨 앞의 scale 한 번에만 씁니다. 그 뒤로는 디자인 단위를 그대로 넘깁니다.
 * 이 규칙 덕분에 미리보기와 내보내기가 같은 명령을 내리고, 두 결과가 어긋날 수 없습니다.
 * 이 함수 안에서 pxPerUnit을 다시 곱하는 순간 그 보장이 깨집니다.
 */
export function paint(scene: Scene, ctx: PaintTarget, pxPerUnit: number, sources: PaintSources): void {
  ctx.save();
  ctx.scale(pxPerUnit, pxPerUnit);
  ctx.fillStyle = scene.background;
  ctx.fillRect(0, 0, scene.width, scene.height);
  for (const node of scene.nodes) paintNode(node, ctx, sources);
  ctx.restore();
}
