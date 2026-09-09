import type { Scene, SceneNode } from '../layout/types';

/** 브라우저와 워커의 2D 컨텍스트가 모두 이 모양을 만족합니다. */
export type PaintTarget = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface PaintSources {
  photo: CanvasImageSource;
  /** 0..1 정규화된 박스에 맞춰 둔 경로입니다. 없으면 null입니다. */
  logo(logoId: string): Path2D | null;
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
      const path = sources.logo(node.logoId);
      if (!path) return;
      ctx.save();
      ctx.translate(node.x, node.y);
      ctx.scale(node.w, node.h);
      ctx.fillStyle = node.fill;
      ctx.fill(path);
      ctx.restore();
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
