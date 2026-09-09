import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { num, str, type PresetOption } from '../options';
import { ellipsize } from '../primitives';
import { resolveSlot } from '../slots';
import { renderTemplate } from '../template';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const BAR_OPTIONS: PresetOption[] = [
  { id: 'MODE', type: 'select', options: ['split', 'single'], default: 'split' },
  { id: 'ALIGN', type: 'select', options: ['left', 'center', 'right'], default: 'center' },
  { id: 'BACKGROUND', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', type: 'color', default: '#111111' },
  { id: 'BAR_HEIGHT', type: 'number', default: 120, unit: 'u' },
  { id: 'SIDE_PADDING', type: 'number', default: 60, unit: 'u' },
  { id: 'FONT_SIZE', type: 'number', default: 34, unit: 'u' },
  { id: 'SUB_SCALE', type: 'range', min: 0.4, max: 1, step: 0.05, default: 0.7 },
  { id: 'FONT_WEIGHT', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  { id: 'DIVIDER', type: 'text', default: '·' },
  { id: 'PRIMARY_MAIN', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'PRIMARY_SUB', type: 'text', default: '' },
  { id: 'SECONDARY_MAIN', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
  { id: 'SECONDARY_SUB', type: 'text', default: '' },
  { id: 'FOOTER', type: 'text', default: '' },
];

export const barLayout: PresetLayout = (input, services) => {
  const options = input.options;
  const barHeight = num(options, 'BAR_HEIGHT');
  const padding = num(options, 'SIDE_PADDING');
  const fontSize = num(options, 'FONT_SIZE');
  const subSize = fontSize * num(options, 'SUB_SCALE');
  const textColor = str(options, 'TEXT_COLOR');
  const divider = str(options, 'DIVIDER');
  const mode = str(options, 'MODE');

  const family = fontStack(fontById(str(options, 'FONT_FAMILY')));
  const weight = num(options, 'FONT_WEIGHT');
  const style = (size: number, align: TextStyle['align']): TextStyle => ({
    family,
    size,
    weight,
    style: 'normal',
    color: textColor,
    align,
    baseline: 'middle',
    alpha: 1,
  });

  const photoWidth = input.photo.width;
  const photoHeight = input.photo.height;
  const nodes: SceneNode[] = [{ kind: 'image', x: 0, y: 0, w: photoWidth, h: photoHeight }];

  const showLogo = input.logoId !== undefined && services.hasLogo(input.logoId);
  const logoWidth = barHeight * 0.6;
  const logoGap = showLogo ? logoWidth + padding * 0.4 : 0;

  const footerText = renderTemplate(str(options, 'FOOTER'), input.fields, divider);
  // 꼬리 줄이 있으면 바를 위아래로 나눠 위쪽에 슬롯을, 아래쪽에 꼬리를 둡니다.
  const footerHeight = footerText ? barHeight * 0.32 : 0;
  const slotHeight = barHeight - footerHeight;
  const slotCenterY = photoHeight + slotHeight / 2;

  if (showLogo && input.logoId !== undefined) {
    const logoHeight = barHeight * 0.4;
    nodes.push({
      kind: 'logo',
      x: padding,
      y: slotCenterY - logoHeight / 2,
      w: logoWidth,
      h: logoHeight,
      logoId: input.logoId,
      fill: textColor,
    });
  }

  /** 주 줄과 부 줄을 세로 가운데를 기준으로 벌려 놓습니다. */
  const push = (slot: 'PRIMARY' | 'SECONDARY', x: number, align: TextStyle['align'], width: number) => {
    const resolved = resolveSlot(options, slot, input.fields, divider);
    const gap = fontSize * 1.25;
    const twoLines = resolved.main !== '' && resolved.sub !== '';

    if (resolved.main) {
      const mainStyle = style(fontSize, align);
      const text = ellipsize(resolved.main, width, mainStyle, services);
      if (text) {
        nodes.push({ kind: 'text', x, y: twoLines ? slotCenterY - gap / 2 : slotCenterY, text, style: mainStyle });
      }
    }
    if (resolved.sub) {
      const subStyle = style(subSize, align);
      const text = ellipsize(resolved.sub, width, subStyle, services);
      if (text) {
        nodes.push({ kind: 'text', x, y: twoLines ? slotCenterY + gap / 2 : slotCenterY, text, style: subStyle });
      }
    }
  };

  if (mode === 'single') {
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const width = photoWidth - padding * 2 - logoGap;
    const x =
      align === 'left' ? padding + logoGap : align === 'right' ? photoWidth - padding : photoWidth / 2;
    push('PRIMARY', x, align, width);
  } else {
    // 좌우 텍스트가 만나지 않도록 각자 절반보다 조금 좁은 폭을 갖습니다.
    const half = (photoWidth - padding * 2 - logoGap) / 2 - padding * 0.25;
    push('PRIMARY', padding + logoGap, 'left', half);
    push('SECONDARY', photoWidth - padding, 'right', half);
  }

  if (footerText) {
    const footerStyle = style(subSize, 'center');
    const text = ellipsize(footerText, photoWidth - padding * 2, footerStyle, services);
    if (text) {
      nodes.push({
        kind: 'text',
        x: photoWidth / 2,
        y: photoHeight + slotHeight + footerHeight / 2,
        text,
        style: footerStyle,
      });
    }
  }

  return {
    width: photoWidth,
    height: photoHeight + barHeight,
    background: str(options, 'BACKGROUND'),
    nodes,
  };
};
