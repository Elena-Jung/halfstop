import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { num, str, type PresetOption } from '../options';
import { ellipsize } from '../primitives';
import { renderTemplate } from '../template';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const INFO_BAR_OPTIONS: PresetOption[] = [
  { id: 'BACKGROUND', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', type: 'color', default: '#111111' },
  { id: 'BAR_HEIGHT', type: 'number', default: 120, unit: 'u' },
  { id: 'SIDE_PADDING', type: 'number', default: 60, unit: 'u' },
  { id: 'FONT_SIZE', type: 'number', default: 34, unit: 'u' },
  { id: 'FONT_WEIGHT', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  { id: 'DIVIDER', type: 'text', default: '·' },
  { id: 'PRIMARY_TEMPLATE', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'SECONDARY_TEMPLATE', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
];

export const infoBarLayout: PresetLayout = (input, services) => {
  const options = input.options;
  const barHeight = num(options, 'BAR_HEIGHT');
  const padding = num(options, 'SIDE_PADDING');
  const fontSize = num(options, 'FONT_SIZE');
  const textColor = str(options, 'TEXT_COLOR');
  const divider = str(options, 'DIVIDER');

  const baseStyle: Omit<TextStyle, 'align'> = {
    family: fontStack(fontById(str(options, 'FONT_FAMILY'))),
    size: fontSize,
    weight: num(options, 'FONT_WEIGHT'),
    style: 'normal',
    color: textColor,
    baseline: 'middle',
    alpha: 1,
  };

  const photoWidth = input.photo.width;
  const photoHeight = input.photo.height;
  const barCenterY = photoHeight + barHeight / 2;
  const nodes: SceneNode[] = [
    { kind: 'image', x: 0, y: 0, w: photoWidth, h: photoHeight },
  ];

  const showLogo = input.logoId !== undefined && services.hasLogo(input.logoId);
  const logoWidth = barHeight * 0.6;
  const logoGap = showLogo ? logoWidth + padding * 0.4 : 0;

  if (showLogo && input.logoId !== undefined) {
    const logoHeight = barHeight * 0.4;
    nodes.push({
      kind: 'logo',
      x: padding,
      y: barCenterY - logoHeight / 2,
      w: logoWidth,
      h: logoHeight,
      logoId: input.logoId,
      fill: textColor,
    });
  }

  // 좌우 텍스트가 만나지 않도록 각자 절반보다 조금 좁은 폭을 갖습니다.
  const available = photoWidth - padding * 2 - logoGap;
  const half = available / 2 - padding * 0.25;

  const leftStyle: TextStyle = { ...baseStyle, align: 'left' };
  const left = ellipsize(
    renderTemplate(str(options, 'PRIMARY_TEMPLATE'), input.fields, divider),
    half,
    leftStyle,
    services,
  );
  if (left) {
    nodes.push({ kind: 'text', x: padding + logoGap, y: barCenterY, text: left, style: leftStyle });
  }

  const rightStyle: TextStyle = { ...baseStyle, align: 'right' };
  const right = ellipsize(
    renderTemplate(str(options, 'SECONDARY_TEMPLATE'), input.fields, divider),
    half,
    rightStyle,
    services,
  );
  if (right) {
    nodes.push({ kind: 'text', x: photoWidth - padding, y: barCenterY, text: right, style: rightStyle });
  }

  return {
    width: photoWidth,
    height: photoHeight + barHeight,
    background: str(options, 'BACKGROUND'),
    nodes,
  };
};
