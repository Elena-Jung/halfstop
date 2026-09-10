import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { bool, num, str, type PresetOption } from '../options';
import { ellipsize, twoLineGap } from '../primitives';
import { resolveSlot } from '../slots';
import { renderTemplate } from '../template';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const BAR_OPTIONS: PresetOption[] = [
  { id: 'MODE', labelKey: 'option.MODE', groupKey: 'arrangement', type: 'select', options: ['split', 'single'], default: 'split' },
  { id: 'ALIGN', labelKey: 'option.ALIGN', groupKey: 'arrangement', type: 'select', options: ['left', 'center', 'right'], default: 'center' },
  { id: 'BACKGROUND', labelKey: 'option.BACKGROUND', groupKey: 'frame', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', labelKey: 'option.TEXT_COLOR', groupKey: 'frame', type: 'color', default: '#111111' },
  { id: 'BAR_HEIGHT', labelKey: 'option.BAR_HEIGHT', groupKey: 'frame', type: 'number', default: 120, unit: 'u', min: 40, max: 500 },
  { id: 'SIDE_PADDING', labelKey: 'option.SIDE_PADDING', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 400 },
  { id: 'FONT_SIZE', labelKey: 'option.FONT_SIZE', groupKey: 'frame', type: 'number', default: 34, unit: 'u', min: 8, max: 120 },
  { id: 'SUB_SCALE', labelKey: 'option.SUB_SCALE', groupKey: 'frame', type: 'range', min: 0.4, max: 1, step: 0.05, default: 0.7 },
  { id: 'FONT_WEIGHT', labelKey: 'option.FONT_WEIGHT', groupKey: 'frame', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', labelKey: 'option.FONT_FAMILY', groupKey: 'frame', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  // 기본을 꺼짐으로 둡니다. 켜면 body-lens 처럼 {MAKER}를 이미 글자로 그리는 배치에서
  // 브랜드 이름이 두 번(글자와 로고) 나올 수 있습니다. 이름이 겹치면 템플릿에서
  // {MAKER}를 빼는 것은 사용자의 몫입니다.
  { id: 'SHOW_LOGO', labelKey: 'option.SHOW_LOGO', groupKey: 'frame', type: 'boolean', default: false },
  { id: 'DIVIDER', labelKey: 'option.DIVIDER', groupKey: 'arrangement', type: 'text', default: '·' },
  { id: 'PRIMARY_MAIN', labelKey: 'option.PRIMARY_MAIN', groupKey: 'arrangement', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'PRIMARY_SUB', labelKey: 'option.PRIMARY_SUB', groupKey: 'arrangement', type: 'text', default: '' },
  { id: 'SECONDARY_MAIN', labelKey: 'option.SECONDARY_MAIN', groupKey: 'arrangement', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
  { id: 'SECONDARY_SUB', labelKey: 'option.SECONDARY_SUB', groupKey: 'arrangement', type: 'text', default: '' },
  { id: 'FOOTER', labelKey: 'option.FOOTER', groupKey: 'arrangement', type: 'text', default: '' },
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

  // SHOW_LOGO 가 꺼져 있으면(기본값) 지금까지와 같이 로고 자리를 아예 만들지
  // 않습니다. 켜져 있으면 그 브랜드의 로고가 있는지에 따라 두 갈래로 나뉩니다.
  // 로고가 있으면 logo 노드, 없으면 브랜드 이름을 글자로 그리는 워드마크(text 노드)
  // 입니다. 워드마크는 로고와 같은 자리와 폭을 씁니다. 이 폭(logoGap)이 두 갈래에서
  // 갈리면 SHOW_LOGO 를 켠 채로 로고 유무만 다른 사진 사이에서 옆 글줄이 흔들립니다.
  const showLogoOption = bool(options, 'SHOW_LOGO');
  const brandName = input.fields.MAKER;
  const hasRealLogo = showLogoOption && input.logoId !== undefined && services.hasLogo(input.logoId);
  const showWordmark = showLogoOption && !hasRealLogo && brandName !== undefined && brandName !== '';
  const showBrandMark = hasRealLogo || showWordmark;
  const logoWidth = barHeight * 0.6;
  const logoGap = showBrandMark ? logoWidth + padding * 0.4 : 0;

  const footerText = renderTemplate(str(options, 'FOOTER'), input.fields, divider);
  // 꼬리 줄이 있으면 바를 위아래로 나눠 위쪽에 슬롯을, 아래쪽에 꼬리를 둡니다.
  const footerHeight = footerText ? barHeight * 0.32 : 0;
  const slotHeight = barHeight - footerHeight;
  const slotCenterY = photoHeight + slotHeight / 2;
  const logoHeight = barHeight * 0.4;

  if (hasRealLogo && input.logoId !== undefined) {
    nodes.push({
      kind: 'logo',
      x: padding,
      y: slotCenterY - logoHeight / 2,
      w: logoWidth,
      h: logoHeight,
      logoId: input.logoId,
      fill: textColor,
    });
  } else if (showWordmark && brandName !== undefined) {
    // 로고 높이에 그대로 맞추면(글자 높이 = logoHeight) 로고 상자가 가로 1.5:1
    // 비율이라 네댓 글자만 넘어도 폭을 크게 넘칩니다. 실제로 이 비율(0.5)로 Inter
    // 서체에 "Canon"을 그려 보면 로고 폭을 살짝(2~3%) 넘기는데, 말줄임표
    // 자체가 넓어 "Can…"까지 잘려 나가는 것을 브라우저에서 확인했습니다. 0.45로
    // 낮추면 "Canon"이 로고 폭 안에 여유 있게(약 8px) 들어갑니다. logoWidth 와의
    // 비가 BAR_HEIGHT 에 무관하게 일정해 이 여유는 바 높이를 얼마로 두어도
    // 유지됩니다.
    const wordmarkSize = logoHeight * 0.45;
    const wordmarkStyle = style(wordmarkSize, 'left');
    const text = ellipsize(brandName, logoWidth, wordmarkStyle, services);
    if (text) {
      nodes.push({ kind: 'text', x: padding, y: slotCenterY, text, style: wordmarkStyle });
    }
  }

  /** 주 줄과 부 줄을 세로 가운데를 기준으로 벌려 놓습니다. */
  const push = (slot: 'PRIMARY' | 'SECONDARY', x: number, align: TextStyle['align'], width: number) => {
    const resolved = resolveSlot(options, slot, input.fields, divider);
    // 두 줄이 들어갈 수 있는 높이는 이 슬롯의 높이입니다.
    const gap = twoLineGap(slotHeight, fontSize, subSize);
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
    // 가운데 정렬은 사진 한가운데를 기준으로 삼으므로 로고 쪽 여백을 양쪽에서 뺍니다.
    const width =
      align === 'center' ? photoWidth - (padding + logoGap) * 2 : photoWidth - padding * 2 - logoGap;
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
