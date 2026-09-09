import type { LayoutServices, TextStyle } from './types';

const ELLIPSIS = '…';

export function ellipsize(
  text: string,
  maxWidth: number,
  style: TextStyle,
  services: LayoutServices,
): string {
  if (text === '' || maxWidth <= 0) return '';
  if (services.measureText(text, style) <= maxWidth) return text;

  const ellipsisWidth = services.measureText(ELLIPSIS, style);
  if (ellipsisWidth > maxWidth) return '';

  const budget = maxWidth - ellipsisWidth;
  const chars = [...text];
  let kept = '';

  for (const char of chars) {
    const candidate = kept + char;
    if (services.measureText(candidate, style) > budget) break;
    kept = candidate;
  }

  return kept === '' ? '' : kept + ELLIPSIS;
}
