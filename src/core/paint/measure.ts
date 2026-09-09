import type { TextStyle } from '../layout/types';

/**
 * 배율 1에서 재므로 반환값의 단위가 곧 디자인 단위입니다.
 * 캔버스 하나를 재사용해 매 호출마다 새로 만들지 않습니다.
 */
export function createMeasurer(): (text: string, style: TextStyle) => number {
  const canvas = new OffscreenCanvas(1, 1);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('측정용 2D 컨텍스트를 만들지 못했습니다');

  return (text, style) => {
    ctx.font = `${style.style} ${style.weight} ${style.size}px ${style.family}`;
    return ctx.measureText(text).width;
  };
}
