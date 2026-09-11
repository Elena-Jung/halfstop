import { LOGO_MAX_ASPECT, logoArt, logoMark } from '../../logos/registry';
import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { bool, num, str, type PresetOption } from '../options';
import { ellipsize, twoLineGap, twoLineHeight } from '../primitives';
import { resolveSlot } from '../slots';
import { renderTemplate } from '../template';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const BAR_OPTIONS: PresetOption[] = [
  { id: 'MODE', labelKey: 'option.MODE', groupKey: 'arrangement', type: 'select', options: ['split', 'single'], default: 'split' },
  { id: 'ALIGN', labelKey: 'option.ALIGN', groupKey: 'arrangement', type: 'select', options: ['left', 'center', 'right'], default: 'center' },
  { id: 'BACKGROUND', labelKey: 'option.BACKGROUND', groupKey: 'frame', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', labelKey: 'option.TEXT_COLOR', groupKey: 'frame', type: 'color', default: '#111111' },
  // 참조한 서비스와 나란히 놓고 비교한 결과입니다. 120 에서는 두 줄이 바 안에서
  // 위아래로 뜬 채 보였습니다. 102 로 낮추면 대부분의 배치에서 글자가 바를 더
  // 채우면서도, 꼬리 줄까지 쓰는 body-lens 배치(가장 빡빡한 경우)에서 주 줄과 부 줄이
  // 서로 겹치지 않습니다. 더 낮추면(95 안팎부터) 그 배치의 두 줄이 맞닿기 시작합니다.
  // 필름 프리셋이 이미 쓰고 있는 100 과 겹치지 않도록 102 를 골랐습니다. 값이 같으면
  // "저장된 값이 이상하면 프리셋 값으로 떨어진다" 는 회귀 검사가 선언 기본값으로
  // 잘못 떨어져도 우연히 통과합니다.
  { id: 'BAR_HEIGHT', labelKey: 'option.BAR_HEIGHT', groupKey: 'frame', type: 'number', default: 102, unit: 'u', min: 40, max: 500 },
  { id: 'SIDE_PADDING', labelKey: 'option.SIDE_PADDING', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 400 },
  { id: 'FONT_SIZE', labelKey: 'option.FONT_SIZE', groupKey: 'frame', type: 'number', default: 34, unit: 'u', min: 8, max: 120 },
  { id: 'SUB_SCALE', labelKey: 'option.SUB_SCALE', groupKey: 'frame', type: 'range', min: 0.4, max: 1, step: 0.05, default: 0.7 },
  { id: 'FONT_WEIGHT', labelKey: 'option.FONT_WEIGHT', groupKey: 'frame', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', labelKey: 'option.FONT_FAMILY', groupKey: 'arrangement', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  // 기본을 꺼짐으로 둡니다. 켜면 body-lens 처럼 {MAKER}를 이미 글자로 그리는 배치에서
  // 브랜드 이름이 두 번(글자와 로고) 나올 수 있습니다. 이름이 겹치면 템플릿에서
  // {MAKER}를 빼는 것은 사용자의 몫입니다.
  { id: 'SHOW_LOGO', labelKey: 'option.SHOW_LOGO', groupKey: 'frame', type: 'boolean', default: false },
  // 로고는 장비 이름이 놓인 슬롯에 붙습니다. 어느 슬롯에 장비가 오는지는 배치가 정하고,
  // 기본 배치(exposure-gear)는 오른쪽에 둡니다. 왼쪽에 장비를 두는 배치도 있어 값으로
  // 둡니다.
  { id: 'LOGO_SIDE', labelKey: 'option.LOGO_SIDE', groupKey: 'frame', type: 'select', options: ['left', 'right'], default: 'right' },
  { id: 'DIVIDER', labelKey: 'option.DIVIDER', groupKey: 'arrangement', type: 'text', default: '·' },
  // EXIF 의 Artist 를 읽지 않습니다. 값이 두 곳(EXIF, 이 칸)에서 올 수 있게 되면 어느
  // 쪽이 이기는지가 모호해집니다. 사용자가 직접 치는 값 하나만 둡니다.
  { id: 'AUTHOR', labelKey: 'option.AUTHOR', groupKey: 'arrangement', type: 'text', default: '' },
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
  const askedFontSize = num(options, 'FONT_SIZE');
  const askedSubSize = askedFontSize * num(options, 'SUB_SCALE');
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
  // 입니다.
  const showLogoOption = bool(options, 'SHOW_LOGO');
  const brandName = input.fields.MAKER;
  const art =
    showLogoOption && input.logoId !== undefined && services.hasLogo(input.logoId)
      ? logoArt(input.logoId)
      : undefined;
  // 마크의 높이입니다. 브랜드와 무관하게 일정해야 로고가 옆 글자와 나란히 읽힙니다.
  const markHeight = barHeight * 0.4;
  const drawn = art === undefined ? undefined : { id: art.id, ...logoMark(art, markHeight) };
  // 워드마크는 자기 글자 폭을 그대로 씁니다. 로고와 같은 폭에 맞출 필요가 없습니다. 같은
  // 사진 안에서는 로고와 워드마크 중 한 갈래만 나오고, 브랜드가 다르면 장비 이름도 달라
  // 옆 글줄이 움직이는 것이 당연하기 때문입니다. 상한만 로고와 같게 두어 EXIF 의 제조사가
  // 유난히 길 때 바 한쪽을 통째로 먹지 않게 합니다.
  //
  // 글자 크기는 markHeight 의 0.45 배입니다. 마크 자리가 1.5대 1 상자이던 시절 "Canon"이
  // 그 상자 폭에 들어가도록 고른 값인데, 폭 제약이 사라진 지금도 옆 글자(FONT_SIZE 34 에
  // markHeight 40.8 이므로 18.36)보다 작게 두는 편이 낫습니다. 워드마크는 로고를 대신하는
  // 표지이고, 글자로 그려진 것이 본문 글자보다 커지면 본문보다 먼저 읽힙니다.
  const wordmarkStyle = style(markHeight * 0.45, 'left');
  const wordmarkText =
    showLogoOption && art === undefined && brandName !== undefined && brandName !== ''
      ? ellipsize(brandName, markHeight * LOGO_MAX_ASPECT, wordmarkStyle, services)
      : '';
  // 마크가 예약하는 폭은 실제로 그려질 폭입니다. 상자를 브랜드와 무관하게 고정해 두던
  // 시절에는 소니처럼 가로로 긴 워드마크가 상자 폭에 먼저 걸려 높이가 4분의 1 로
  // 뭉개졌습니다.
  const markWidth =
    drawn?.width ?? (wordmarkText === '' ? 0 : services.measureText(wordmarkText, wordmarkStyle));
  const showBrandMark = markWidth > 0;
  // 로고와 장비명 사이의 세로 구분선입니다. 새 노드 종류를 만들지 않고 아주 얇은 rect
  // 하나를 세워 긋습니다.
  const ruleWidth = barHeight * 0.02;
  // 마크 안쪽의 간격은 프레임 여백이 아니라 마크 높이를 따릅니다. SIDE_PADDING 은 0 까지
  // 내려가는 값이라, 여백을 따르면 그때 로고와 구분선과 글자가 맞붙습니다. 폭이 아니라
  // 높이를 따르는 것은 폭이 이제 브랜드마다 다르기 때문입니다. 간격까지 따라 달라지면
  // 납작한 로고 옆만 헐거워 보입니다.
  const markGap = markHeight * 0.3;
  const logoGap = showBrandMark ? markWidth + markGap * 2 + ruleWidth : 0;

  const footerText = renderTemplate(str(options, 'FOOTER'), input.fields, divider);
  // 꼬리 줄이 있으면 바를 위아래로 나눠 위쪽에 슬롯을, 아래쪽에 꼬리를 둡니다.
  const footerHeight = footerText ? barHeight * 0.32 : 0;
  const slotHeight = barHeight - footerHeight;
  const slotCenterY = photoHeight + slotHeight / 2;

  // 슬롯이 글자 한 줄 높이보다 좁으면 간격을 0 까지 좁혀도 글자가 사진을 덮습니다. 슬롯
  // 가운데에서 위아래로 반높이씩 뻗는 구조라 간격으로는 막을 수 없습니다. 그래서 글자를
  // 슬롯에 맞춰 줄입니다. 바 높이를 대신 늘리면 사용자가 고른 프레임 크기가 슬라이더 값과
  // 달라지므로, 프레임을 그대로 두고 글자를 줄이는 쪽을 골랐습니다.
  //
  // 슬롯이 넉넉하면 계수가 정확히 1 이고 1 을 곱한 값은 비트까지 같습니다. 지금 프레임
  // 값들은 모두 그쪽이라 겉모습이 달라지지 않습니다.
  //
  // 꼬리 줄은 슬롯 아래에 따로 놓이므로 이 계수에 들어가지 않습니다. 슬롯이 두 줄 높이를
  // 지키면 꼬리 줄의 위끝은 사진 아래변보다 slotHeight 의 절반 이상 아래에 있습니다.
  const fit = Math.min(1, slotHeight / twoLineHeight(askedFontSize, askedSubSize));
  const fontSize = askedFontSize * fit;
  const subSize = askedSubSize * fit;

  /**
   * 슬롯의 두 줄을 미리 잘라 두고 실제로 그려질 폭을 잽니다. 로고가 글 덩어리에 붙으려면
   * 자리를 정하기 전에 그 폭을 알아야 하기 때문에, 자르는 일과 놓는 일을 나눴습니다.
   */
  const prepare = (slot: 'PRIMARY' | 'SECONDARY', align: TextStyle['align'], width: number) => {
    const resolved = resolveSlot(options, slot, input.fields, divider);
    const mainStyle = style(fontSize, align);
    const subStyle = style(subSize, align);
    const main = ellipsize(resolved.main, width, mainStyle, services);
    const sub = ellipsize(resolved.sub, width, subStyle, services);
    return {
      main,
      sub,
      mainStyle,
      subStyle,
      width: Math.max(
        main ? services.measureText(main, mainStyle) : 0,
        sub ? services.measureText(sub, subStyle) : 0,
      ),
    };
  };

  type Block = ReturnType<typeof prepare>;

  /** 잘라 둔 두 줄을 세로 가운데를 기준으로 벌려 놓습니다. x 는 그 정렬의 기준점입니다. */
  const place = (block: Block, x: number) => {
    // 두 줄이 들어갈 수 있는 높이는 이 슬롯의 높이입니다.
    const gap = twoLineGap(slotHeight, fontSize, subSize);
    const twoLines = block.main !== '' && block.sub !== '';
    if (block.main) {
      const y = twoLines ? slotCenterY - gap / 2 : slotCenterY;
      nodes.push({ kind: 'text', x, y, text: block.main, style: block.mainStyle });
    }
    if (block.sub) {
      const y = twoLines ? slotCenterY + gap / 2 : slotCenterY;
      nodes.push({ kind: 'text', x, y, text: block.sub, style: block.subStyle });
    }
  };

  /**
   * 로고(없으면 워드마크)와 세로 구분선을 놓습니다. boxX 는 마크의 왼쪽 끝이고, 구분선은
   * 그 오른쪽에 붙어 글 덩어리와의 사이를 가릅니다.
   *
   * 마크가 차지하는 세로는 언제나 markHeight 이고 가로는 그려질 폭 그대로입니다. 로고가
   * 폭 상한에 걸려 높이를 내준 경우에만 남는 높이를 위아래로 나눠 가운데에 둡니다.
   */
  const placeMark = (boxX: number) => {
    const markTop = slotCenterY - markHeight / 2;
    if (drawn) {
      nodes.push({
        kind: 'logo',
        x: boxX,
        y: markTop + drawn.y,
        w: drawn.width,
        h: drawn.height,
        logoId: drawn.id,
        // 물들여야 하는 로고에서만 쓰이는 색입니다. 니콘의 노란 상자처럼 색이 뜻을 갖는
        // 로고는 이 값을 쓰지 않습니다.
        fill: textColor,
      });
    } else {
      nodes.push({ kind: 'text', x: boxX, y: slotCenterY, text: wordmarkText, style: wordmarkStyle });
    }
    nodes.push({
      kind: 'rect',
      x: boxX + markWidth + markGap,
      y: markTop,
      w: ruleWidth,
      h: markHeight,
      fill: textColor,
      // 글자와 같은 세기로 그으면 선이 글보다 먼저 읽힙니다. 가르는 일만 하면 됩니다.
      alpha: 0.35,
    });
  };

  const textRight = photoWidth - padding;

  if (mode === 'single') {
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const block = prepare('PRIMARY', align, photoWidth - padding * 2 - logoGap);
    // 슬롯이 하나뿐이라 LOGO_SIDE 가 가리킬 다른 슬롯이 없습니다. 로고는 언제나 그 한
    // 덩어리의 왼쪽에 붙습니다. 좌우 어느 슬롯에 붙든 로고가 글자보다 앞서 읽히는 것이
    // split 에서의 모습이고, single 만 반대로 두면 같은 옵션이 모드마다 다른 뜻이 됩니다.
    //
    // 로고와 글을 한 덩어리로 보고 그 덩어리를 정렬합니다. 글만 정렬하고 로고를 그 옆에
    // 달면 가운데 정렬에서 덩어리가 오른쪽으로 치우칩니다.
    const groupWidth = logoGap + block.width;
    const groupLeft =
      align === 'left' ? padding : align === 'right' ? textRight - groupWidth : (photoWidth - groupWidth) / 2;
    if (showBrandMark) placeMark(groupLeft);
    const textLeft = groupLeft + logoGap;
    place(
      block,
      align === 'left' ? textLeft : align === 'right' ? textLeft + block.width : textLeft + block.width / 2,
    );
  } else {
    // 좌우 텍스트가 만나지 않도록 각자 절반보다 조금 좁은 폭을 갖습니다. 로고 자리는 둘
    // 사이에서 빠지므로, 로고를 켜고 꺼도 두 슬롯의 기준점은 제자리에 있습니다.
    const half = (photoWidth - padding * 2 - logoGap) / 2 - padding * 0.25;
    const logoSide = str(options, 'LOGO_SIDE');
    const primary = prepare('PRIMARY', 'left', half);
    const secondary = prepare('SECONDARY', 'right', half);
    if (showBrandMark) {
      // 왼쪽 슬롯은 글이 왼쪽 끝에서 시작하므로 로고가 그 앞(여백 자리)에 섭니다.
      // 오른쪽 슬롯은 글이 오른쪽 끝에 맞춰 있어 덩어리의 왼쪽 끝이 글 길이를 따라
      // 움직이므로, 잰 폭만큼 물러난 자리에 섭니다.
      placeMark(logoSide === 'left' ? padding : textRight - secondary.width - logoGap);
    }
    place(primary, logoSide === 'left' ? padding + logoGap : padding);
    place(secondary, textRight);
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
