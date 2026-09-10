import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { num, str, type PresetOption } from '../options';
import { ellipsize, halfHeight, twoLineGap } from '../primitives';
import { resolveSlot } from '../slots';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const MATTE_OPTIONS: PresetOption[] = [
  { id: 'MODE', labelKey: 'option.MODE', groupKey: 'frame', type: 'select', options: ['split', 'single', 'poster'], default: 'split' },
  { id: 'ALIGN', labelKey: 'option.ALIGN', groupKey: 'text', type: 'select', options: ['left', 'center', 'right'], default: 'center' },
  { id: 'BACKGROUND', labelKey: 'option.BACKGROUND', groupKey: 'frame', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', labelKey: 'option.TEXT_COLOR', groupKey: 'text', type: 'color', default: '#111111' },
  { id: 'PAD_TOP', labelKey: 'option.PAD_TOP', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 600 },
  { id: 'PAD_RIGHT', labelKey: 'option.PAD_RIGHT', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 600 },
  { id: 'PAD_BOTTOM', labelKey: 'option.PAD_BOTTOM', groupKey: 'frame', type: 'number', default: 200, unit: 'u', min: 0, max: 600 },
  { id: 'PAD_LEFT', labelKey: 'option.PAD_LEFT', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 600 },
  { id: 'FONT_SIZE', labelKey: 'option.FONT_SIZE', groupKey: 'text', type: 'number', default: 30, unit: 'u', min: 8, max: 120 },
  // poster 에서는 가운데 줄이 커야 하므로 1보다 큰 값도 받습니다.
  { id: 'SUB_SCALE', labelKey: 'option.SUB_SCALE', groupKey: 'text', type: 'range', min: 0.4, max: 3, step: 0.05, default: 0.7 },
  { id: 'FONT_WEIGHT', labelKey: 'option.FONT_WEIGHT', groupKey: 'text', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', labelKey: 'option.FONT_FAMILY', groupKey: 'text', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  { id: 'DIVIDER', labelKey: 'option.DIVIDER', groupKey: 'text', type: 'text', default: '·' },
  { id: 'PRIMARY_MAIN', labelKey: 'option.PRIMARY_MAIN', groupKey: 'text', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'PRIMARY_SUB', labelKey: 'option.PRIMARY_SUB', groupKey: 'text', type: 'text', default: '' },
  { id: 'SECONDARY_MAIN', labelKey: 'option.SECONDARY_MAIN', groupKey: 'text', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
  { id: 'SECONDARY_SUB', labelKey: 'option.SECONDARY_SUB', groupKey: 'text', type: 'text', default: '' },
];

export const matteLayout: PresetLayout = (input, services) => {
  const options = input.options;
  const padTop = num(options, 'PAD_TOP');
  const padRight = num(options, 'PAD_RIGHT');
  const padBottom = num(options, 'PAD_BOTTOM');
  const padLeft = num(options, 'PAD_LEFT');
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
  const width = photoWidth + padLeft + padRight;
  const height = photoHeight + padTop + padBottom;

  const nodes: SceneNode[] = [
    { kind: 'image', x: padLeft, y: padTop, w: photoWidth, h: photoHeight },
  ];

  // 글은 아래 여백 안에만 놓습니다.
  const areaTop = padTop + photoHeight;
  const areaCenterY = areaTop + padBottom / 2;
  // 좌우 여백이 0 이어도 글이 가장자리에 붙지 않도록 최소 안쪽 여백을 둡니다.
  const leftInset = Math.max(padLeft, fontSize);
  const rightInset = Math.max(padRight, fontSize);
  const textWidth = width - leftInset - rightInset;

  const primary = resolveSlot(options, 'PRIMARY', input.fields, divider);
  const secondary = resolveSlot(options, 'SECONDARY', input.fields, divider);

  const put = (text: string, size: number, align: TextStyle['align'], x: number, y: number, max: number) => {
    if (!text) return;
    const textStyle = style(size, align);
    const clipped = ellipsize(text, max, textStyle, services);
    if (clipped) nodes.push({ kind: 'text', x, y, text: clipped, style: textStyle });
  };

  // 두 줄이 들어갈 수 있는 높이는 아래 여백입니다. 여백을 넘어간 글은 캔버스에서 잘려
  // 아예 사라지므로, 겹침과 이탈 중 하나를 골라야 한다면 이탈을 막는 쪽을 지킵니다.
  const gap = twoLineGap(padBottom, fontSize, subSize);

  if (mode === 'poster') {
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const x = align === 'left' ? leftInset : align === 'right' ? width - rightInset : width / 2;
    if (primary.sub === '') {
      // 가운데 줄이 비면 세 줄 자리를 그대로 두지 않고 남은 두 줄을 모읍니다. single 과
      // split 이 빈 줄을 다루는 것과 같습니다.
      //
      // 남는 두 줄은 둘 다 fontSize 입니다. 위에서 구한 gap 은 subSize 를 보고 계산한
      // 것이라 그대로 쓰면 그리지도 않을 줄의 크기가 배치를 정합니다. 실제로 그릴 두 크기로
      // 다시 구합니다.
      const pairGap = twoLineGap(padBottom, fontSize, fontSize);
      const twoLines = primary.main !== '' && secondary.main !== '';
      put(primary.main, fontSize, align, x, twoLines ? areaCenterY - pairGap / 2 : areaCenterY, textWidth);
      put(secondary.main, fontSize, align, x, twoLines ? areaCenterY + pairGap / 2 : areaCenterY, textWidth);
    } else {
      // 위 작게, 가운데 크게, 아래 작게. 세 줄을 아래 여백 안에 세로로 나눕니다.
      // 가운데 줄이 커지면 간격도 함께 벌리되, 아래 여백을 넘지 않게 묶어 둡니다.
      // step 을 제한하는 것은 바깥 두 줄입니다. 그 둘은 fontSize 크기이므로 여기에 subSize 가
      // 들어가면 가운데 줄이 커질 때 step 을 필요 이상으로 좁혀 줄끼리 겹칩니다. step 은 중심에서
      // 그대로 옮긴 거리이므로 반높이 하나만 빼면 됩니다. 위의 room 이 반높이 두 개를 빼는 것과
      // 다른 이유가 그것입니다.
      //
      // 가운데 줄은 step 과 무관하게 언제나 areaCenterY 에 놓입니다. 그래서 subSize 의 반높이가
      // 여백 절반을 넘으면 step 을 아무리 줄여도 가운데 줄이 여백 밖으로 나갑니다. SUB_SCALE
      // 최댓값 3 에 아래 여백이 좁으면 실제로 일어납니다. 간격으로 막을 수 없고 옵션 범위에서
      // 막아야 하는 한계입니다.
      const posterWanted = Math.max(padBottom / 4, halfHeight(fontSize) + halfHeight(subSize));
      const posterRoom = padBottom / 2 - halfHeight(fontSize);
      const step = Math.max(0, Math.min(posterWanted, posterRoom));
      put(primary.main, fontSize, align, x, areaCenterY - step, textWidth);
      put(primary.sub, subSize, align, x, areaCenterY, textWidth);
      put(secondary.main, fontSize, align, x, areaCenterY + step, textWidth);
    }
  } else if (mode === 'single') {
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const x = align === 'left' ? leftInset : align === 'right' ? width - rightInset : width / 2;
    const twoLines = primary.main !== '' && primary.sub !== '';
    put(primary.main, fontSize, align, x, twoLines ? areaCenterY - gap / 2 : areaCenterY, textWidth);
    put(primary.sub, subSize, align, x, twoLines ? areaCenterY + gap / 2 : areaCenterY, textWidth);
  } else {
    const half = textWidth / 2 - fontSize;
    const leftTwo = primary.main !== '' && primary.sub !== '';
    put(primary.main, fontSize, 'left', leftInset, leftTwo ? areaCenterY - gap / 2 : areaCenterY, half);
    put(primary.sub, subSize, 'left', leftInset, leftTwo ? areaCenterY + gap / 2 : areaCenterY, half);
    const rightTwo = secondary.main !== '' && secondary.sub !== '';
    const rx = width - rightInset;
    put(secondary.main, fontSize, 'right', rx, rightTwo ? areaCenterY - gap / 2 : areaCenterY, half);
    put(secondary.sub, subSize, 'right', rx, rightTwo ? areaCenterY + gap / 2 : areaCenterY, half);
  }

  return { width, height, background: str(options, 'BACKGROUND'), nodes };
};
