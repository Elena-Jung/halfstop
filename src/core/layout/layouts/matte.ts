import { fitLogoBox, logoArt } from '../../logos/registry';
import { DEFAULT_FONT_ID, FONT_IDS, fontById, fontStack } from '../../paint/fontFamilies';
import { bool, num, str, type PresetOption } from '../options';
import { ellipsize, halfHeight, twoLineGap } from '../primitives';
import { resolveSlot } from '../slots';
import type { PresetLayout, SceneNode, TextStyle } from '../types';

export const MATTE_OPTIONS: PresetOption[] = [
  { id: 'MODE', labelKey: 'option.MODE', groupKey: 'arrangement', type: 'select', options: ['split', 'single', 'poster'], default: 'split' },
  { id: 'ALIGN', labelKey: 'option.ALIGN', groupKey: 'arrangement', type: 'select', options: ['left', 'center', 'right'], default: 'center' },
  { id: 'BACKGROUND', labelKey: 'option.BACKGROUND', groupKey: 'frame', type: 'color', default: '#ffffff' },
  { id: 'TEXT_COLOR', labelKey: 'option.TEXT_COLOR', groupKey: 'frame', type: 'color', default: '#111111' },
  { id: 'PAD_TOP', labelKey: 'option.PAD_TOP', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 600 },
  { id: 'PAD_RIGHT', labelKey: 'option.PAD_RIGHT', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 600 },
  { id: 'PAD_BOTTOM', labelKey: 'option.PAD_BOTTOM', groupKey: 'frame', type: 'number', default: 200, unit: 'u', min: 0, max: 600 },
  { id: 'PAD_LEFT', labelKey: 'option.PAD_LEFT', groupKey: 'frame', type: 'number', default: 60, unit: 'u', min: 0, max: 600 },
  { id: 'FONT_SIZE', labelKey: 'option.FONT_SIZE', groupKey: 'frame', type: 'number', default: 30, unit: 'u', min: 8, max: 120 },
  // poster 에서는 가운데 줄이 커야 하므로 1보다 큰 값도 받습니다.
  { id: 'SUB_SCALE', labelKey: 'option.SUB_SCALE', groupKey: 'frame', type: 'range', min: 0.4, max: 3, step: 0.05, default: 0.7 },
  { id: 'FONT_WEIGHT', labelKey: 'option.FONT_WEIGHT', groupKey: 'frame', type: 'range', min: 100, max: 900, step: 100, default: 400 },
  { id: 'FONT_FAMILY', labelKey: 'option.FONT_FAMILY', groupKey: 'arrangement', type: 'select', options: FONT_IDS, default: DEFAULT_FONT_ID },
  // 선언 기본값은 꺼짐입니다. 폴라로이드와 포스터 프리셋이 켜진 값을 따로 정하는데, 선언
  // 기본값까지 켜짐이면 어느 쪽이 정한 것인지 값만 보고는 읽을 수 없습니다.
  { id: 'SHOW_LOGO', labelKey: 'option.SHOW_LOGO', groupKey: 'frame', type: 'boolean', default: false },
  // 로고는 장비 이름이 놓인 슬롯에 붙습니다. 어느 슬롯에 장비가 오는지는 배치가 정합니다.
  // 기본값이 하단 바(right)와 다른 것은 좌우로 나뉘는 배치가 반대이기 때문입니다. 여백
  // 액자에서 좌우로 나뉘는 배치는 polaroid 하나뿐이고 그것이 장비를 왼쪽에 둡니다.
  // 좌우로 나뉘지 않는 single 과 poster 에는 슬롯이 하나뿐이라 이 값이 가리킬 다른 쪽이
  // 없고, 그때는 언제나 그 한 덩어리의 왼쪽에 섭니다.
  { id: 'LOGO_SIDE', labelKey: 'option.LOGO_SIDE', groupKey: 'frame', type: 'select', options: ['left', 'right'], default: 'left' },
  { id: 'DIVIDER', labelKey: 'option.DIVIDER', groupKey: 'arrangement', type: 'text', default: '·' },
  // EXIF 의 Artist 를 읽지 않습니다. 값이 두 곳(EXIF, 이 칸)에서 올 수 있게 되면 어느
  // 쪽이 이기는지가 모호해집니다. 사용자가 직접 치는 값 하나만 둡니다.
  { id: 'AUTHOR', labelKey: 'option.AUTHOR', groupKey: 'arrangement', type: 'text', default: '' },
  { id: 'PRIMARY_MAIN', labelKey: 'option.PRIMARY_MAIN', groupKey: 'arrangement', type: 'text', default: '{MAKER}{BODY}' },
  { id: 'PRIMARY_SUB', labelKey: 'option.PRIMARY_SUB', groupKey: 'arrangement', type: 'text', default: '' },
  { id: 'SECONDARY_MAIN', labelKey: 'option.SECONDARY_MAIN', groupKey: 'arrangement', type: 'text', default: '{MM}{F}{SEC}{ISO}' },
  { id: 'SECONDARY_SUB', labelKey: 'option.SECONDARY_SUB', groupKey: 'arrangement', type: 'text', default: '' },
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

  // SHOW_LOGO 가 꺼져 있으면(선언 기본값) 로고 자리를 아예 만들지 않습니다. 켜져 있으면
  // 그 브랜드의 로고가 있는지에 따라 두 갈래로 나뉩니다. 로고가 있으면 logo 노드, 없으면
  // 브랜드 이름을 글자로 그리는 워드마크(text 노드)입니다. 워드마크는 로고와 같은 자리와
  // 폭을 씁니다. 이 폭(logoGap)이 두 갈래에서 갈리면 SHOW_LOGO 를 켠 채로 로고 유무만
  // 다른 사진 사이에서 옆 글줄이 흔들립니다. bar.ts 와 같은 구조입니다.
  const showLogoOption = bool(options, 'SHOW_LOGO');
  const brandName = input.fields.MAKER;
  const art =
    showLogoOption && input.logoId !== undefined && services.hasLogo(input.logoId)
      ? logoArt(input.logoId)
      : undefined;
  const showWordmark = showLogoOption && art === undefined && brandName !== undefined && brandName !== '';

  // 마크 상자의 크기입니다. 하단 바는 바 높이에서 뽑지만, 여백 액자의 아래 여백은 글자
  // 크기의 열 배를 넘기도 해서 같은 비율을 그대로 옮기면 로고만 거대해집니다. 글 옆에
  // 붙는 물건이므로 글자 크기를 따르고 비만 하단 바와 같게 둡니다. 기본 하단 바(바 102,
  // 글자 34)가 내는 40.8 x 61.2 와 같은 모양입니다.
  //
  // 아래 여백으로 묶는 것은 그 값이 0 까지 내려가기 때문입니다. 마크는 아래 여백의
  // 한가운데에 서므로 높이가 여백을 넘으면 절반이 사진 위로 올라갑니다. 여백이 0 이면
  // 높이도 0 이 되어 마크가 통째로 빠지고, 예약하는 폭도 함께 0 이 되어 글이 밀리지
  // 않습니다. 글 쪽은 좁은 여백에서 사진을 덮는 한계가 남아 있지만(known_limits) 그것은
  // 글자를 줄여야 풀리는 별개의 문제입니다.
  const markHeight = Math.min(fontSize * 1.2, padBottom);
  const markWidth = markHeight * 1.5;
  // 로고와 글 사이의 세로 구분선입니다. 새 노드 종류를 만들지 않고 아주 얇은 rect 하나를
  // 세워 긋습니다.
  const ruleWidth = markHeight * 0.05;
  // 마크 안쪽의 간격은 프레임 여백이 아니라 마크 크기를 따릅니다. 좌우 여백은 0 까지
  // 내려가는 값이라, 여백을 따르면 그때 로고와 구분선과 글자가 맞붙습니다.
  const markGap = markWidth * 0.2;
  const showBrandMark = (art !== undefined || showWordmark) && markHeight > 0;
  const logoGap = showBrandMark ? markWidth + markGap * 2 + ruleWidth : 0;

  interface Line {
    text: string;
    style: TextStyle;
  }

  /**
   * 한 줄을 미리 잘라 둡니다. 마크가 글 덩어리에 붙으려면 자리를 정하기 전에 그 덩어리가
   * 실제로 차지할 폭을 알아야 하므로, 자르는 일과 놓는 일을 나눴습니다.
   */
  const prepare = (text: string, size: number, align: TextStyle['align'], max: number): Line => {
    const lineStyle = style(size, align);
    return { text: text === '' ? '' : ellipsize(text, max, lineStyle, services), style: lineStyle };
  };

  const put = (line: Line, x: number, y: number) => {
    if (line.text) nodes.push({ kind: 'text', x, y, text: line.text, style: line.style });
  };

  /** 덩어리의 폭은 그 안에서 가장 긴 줄의 폭입니다. 그리지 않는 빈 줄은 세지 않습니다. */
  const blockWidth = (lines: readonly Line[]): number =>
    lines.reduce(
      (widest, line) => Math.max(widest, line.text ? services.measureText(line.text, line.style) : 0),
      0,
    );

  /**
   * 마크(로고 또는 워드마크)와 세로 구분선을 놓습니다. boxX 는 마크 상자의 왼쪽 끝이고,
   * 구분선은 그 오른쪽에 붙어 글 덩어리와의 사이를 가릅니다. 세 모드 모두 글이 아래 여백의
   * 한가운데를 기준으로 위아래로 벌어지므로, 마크의 세로 중심도 언제나 그 자리입니다.
   *
   * 상자의 크기는 브랜드와 무관하게 일정하고, 그림은 그 안에서 자기 비율대로 가운데
   * 정렬됩니다. 상자가 브랜드마다 달라지면 예약하는 폭도 달라져 사진을 바꿀 때마다 옆
   * 글줄이 흔들립니다.
   */
  const placeMark = (boxX: number) => {
    const boxY = areaCenterY - markHeight / 2;
    if (art) {
      const drawn = fitLogoBox(art, { width: markWidth, height: markHeight });
      nodes.push({
        kind: 'logo',
        x: boxX + drawn.x,
        y: boxY + drawn.y,
        w: drawn.width,
        h: drawn.height,
        logoId: art.id,
        // 물들여야 하는 로고에서만 쓰이는 색입니다. 니콘의 노란 상자처럼 색이 뜻을 갖는
        // 로고는 이 값을 쓰지 않습니다.
        fill: textColor,
      });
    } else if (brandName !== undefined) {
      // 상자 높이에 그대로 맞추면 상자가 가로 1.5:1 비율이라 네댓 글자만 넘어도 폭을
      // 넘칩니다. 0.45 는 bar.ts 가 브라우저에서 "Canon"을 그려 확인한 값이고, 상자의
      // 가로세로 비가 같으므로 여기서도 같은 여유가 나옵니다.
      const wordmarkStyle = style(markHeight * 0.45, 'left');
      const text = ellipsize(brandName, markWidth, wordmarkStyle, services);
      if (text) {
        nodes.push({ kind: 'text', x: boxX, y: areaCenterY, text, style: wordmarkStyle });
      }
    }
    nodes.push({
      kind: 'rect',
      x: boxX + markWidth + markGap,
      y: boxY,
      w: ruleWidth,
      h: markHeight,
      fill: textColor,
      // 글자와 같은 세기로 그으면 선이 글보다 먼저 읽힙니다. 가르는 일만 하면 됩니다.
      alpha: 0.35,
    });
  };

  /**
   * 슬롯이 하나뿐인 모드(single, poster)에서 글 덩어리의 기준점을 정하고, 마크가 있으면
   * 그 왼쪽에 세웁니다. 마크와 글을 한 덩어리로 보고 그 덩어리를 정렬합니다. 글만 정렬하고
   * 마크를 그 옆에 달면 가운데 정렬에서 덩어리가 오른쪽으로 치우칩니다.
   *
   * 마크가 없으면 예약할 폭이 없으므로 여백 안쪽 끝(또는 한가운데)이 그대로 기준점입니다.
   * 덩어리 폭을 더했다 빼는 식으로 같은 값을 다시 구하지 않는 것은, 그 왕복에서 부동소수점
   * 끝자리가 흔들려 로고를 쓰지 않는 프레임의 좌표가 미세하게 달라지기 때문입니다.
   */
  const anchorWithMark = (align: TextStyle['align'], lines: readonly Line[]): number => {
    const plain = align === 'left' ? leftInset : align === 'right' ? width - rightInset : width / 2;
    if (!showBrandMark) return plain;
    const block = blockWidth(lines);
    const groupWidth = logoGap + block;
    const groupLeft =
      align === 'left'
        ? leftInset
        : align === 'right'
          ? width - rightInset - groupWidth
          : (width - groupWidth) / 2;
    placeMark(groupLeft);
    const textLeft = groupLeft + logoGap;
    return align === 'left' ? textLeft : align === 'right' ? textLeft + block : textLeft + block / 2;
  };

  /** 슬롯이 하나뿐인 모드에서 글 한 줄이 쓸 수 있는 폭입니다. 마크 자리가 빠집니다. */
  const oneBlockWidth = textWidth - logoGap;

  // 두 줄이 들어갈 수 있는 높이는 아래 여백입니다. 여백을 넘어간 글은 캔버스에서 잘려
  // 아예 사라지므로, 겹침과 이탈 중 하나를 골라야 한다면 이탈을 막는 쪽을 지킵니다.
  const gap = twoLineGap(padBottom, fontSize, subSize);

  if (mode === 'poster') {
    // 포스터는 글을 위아래로 쌓으므로 마크가 붙을 자리가 쌓인 글 전체의 왼쪽 아니면
    // 오른쪽입니다. 왼쪽으로 정했습니다. 첫째로 split 에서 마크는 언제나 글 덩어리의
    // 왼쪽에 서고, 포스터만 반대로 두면 같은 옵션이 모드마다 다른 뜻이 됩니다. 둘째로
    // 포스터 배치의 기본 정렬이 left 라 쌓인 글의 왼쪽 변이 한 줄로 가지런한 반면,
    // 오른쪽은 줄마다 끝나는 자리가 달라 마크가 가장 긴 줄 하나에만 매달려 보입니다.
    const align = str(options, 'ALIGN') as TextStyle['align'];
    if (primary.sub === '') {
      // 가운데 줄이 비면 세 줄 자리를 그대로 두지 않고 남은 두 줄을 모읍니다. single 과
      // split 이 빈 줄을 다루는 것과 같습니다.
      //
      // 남는 두 줄은 둘 다 fontSize 입니다. 위에서 구한 gap 은 subSize 를 보고 계산한
      // 것이라 그대로 쓰면 그리지도 않을 줄의 크기가 배치를 정합니다. 실제로 그릴 두 크기로
      // 다시 구합니다.
      const pairGap = twoLineGap(padBottom, fontSize, fontSize);
      const twoLines = primary.main !== '' && secondary.main !== '';
      const first = prepare(primary.main, fontSize, align, oneBlockWidth);
      const second = prepare(secondary.main, fontSize, align, oneBlockWidth);
      const x = anchorWithMark(align, [first, second]);
      put(first, x, twoLines ? areaCenterY - pairGap / 2 : areaCenterY);
      put(second, x, twoLines ? areaCenterY + pairGap / 2 : areaCenterY);
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
      const top = prepare(primary.main, fontSize, align, oneBlockWidth);
      const middle = prepare(primary.sub, subSize, align, oneBlockWidth);
      const bottom = prepare(secondary.main, fontSize, align, oneBlockWidth);
      const x = anchorWithMark(align, [top, middle, bottom]);
      put(top, x, areaCenterY - step);
      put(middle, x, areaCenterY);
      put(bottom, x, areaCenterY + step);
    }
  } else if (mode === 'single') {
    const align = str(options, 'ALIGN') as TextStyle['align'];
    const twoLines = primary.main !== '' && primary.sub !== '';
    const main = prepare(primary.main, fontSize, align, oneBlockWidth);
    const sub = prepare(primary.sub, subSize, align, oneBlockWidth);
    const x = anchorWithMark(align, [main, sub]);
    put(main, x, twoLines ? areaCenterY - gap / 2 : areaCenterY);
    put(sub, x, twoLines ? areaCenterY + gap / 2 : areaCenterY);
  } else {
    // 좌우 글이 만나지 않도록 각자 절반보다 조금 좁은 폭을 갖습니다. 마크 자리는 둘
    // 사이에서 빠지므로, 마크를 켜고 꺼도 두 슬롯의 기준점은 제자리에 있습니다.
    const half = (textWidth - logoGap) / 2 - fontSize;
    const logoSide = str(options, 'LOGO_SIDE');
    const rx = width - rightInset;
    const leftMain = prepare(primary.main, fontSize, 'left', half);
    const leftSub = prepare(primary.sub, subSize, 'left', half);
    const rightMain = prepare(secondary.main, fontSize, 'right', half);
    const rightSub = prepare(secondary.sub, subSize, 'right', half);
    if (showBrandMark) {
      // 왼쪽 슬롯은 글이 왼쪽 끝에서 시작하므로 마크가 그 앞(여백 자리)에 섭니다.
      // 오른쪽 슬롯은 글이 오른쪽 끝에 맞춰 있어 덩어리의 왼쪽 끝이 글 길이를 따라
      // 움직이므로, 잰 폭만큼 물러난 자리에 섭니다.
      placeMark(logoSide === 'left' ? leftInset : rx - blockWidth([rightMain, rightSub]) - logoGap);
    }
    const lx = logoSide === 'left' ? leftInset + logoGap : leftInset;
    const leftTwo = primary.main !== '' && primary.sub !== '';
    put(leftMain, lx, leftTwo ? areaCenterY - gap / 2 : areaCenterY);
    put(leftSub, lx, leftTwo ? areaCenterY + gap / 2 : areaCenterY);
    const rightTwo = secondary.main !== '' && secondary.sub !== '';
    put(rightMain, rx, rightTwo ? areaCenterY - gap / 2 : areaCenterY);
    put(rightSub, rx, rightTwo ? areaCenterY + gap / 2 : areaCenterY);
  }

  return { width, height, background: str(options, 'BACKGROUND'), nodes };
};
