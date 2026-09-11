/**
 * 어떤 정보가 어디에 들어가는지를 정합니다. 프레임(감싸는 모양과 색)과 축을 나눈 결과입니다.
 * 슬롯 구성(MODE)과 슬롯에 담을 내용(PRIMARY_MAIN 같은 템플릿)을 한 덩어리로 묶어, 배치를
 * 바꿀 때 슬롯만 줄고 내용이 갈 곳을 잃는 일을 막습니다.
 */
export interface Arrangement {
  id: string;
  /** 화면에 보일 이름의 번역 키입니다. core 는 번역하지 않습니다. */
  labelKey: string;
  /** 어느 레이아웃에서 쓸 수 있는지입니다. 예를 들어 poster 는 여백 액자에서만 뜻이 있습니다. */
  layouts: readonly ('bar' | 'matte')[];
  /** 이 배치가 통째로 정하는 값입니다. 일부만 골라 쓰지 않습니다. */
  values: {
    MODE: string;
    ALIGN: string;
    DIVIDER: string;
    PRIMARY_MAIN: string;
    PRIMARY_SUB: string;
    SECONDARY_MAIN: string;
    SECONDARY_SUB: string;
    FOOTER: string;
  };
}

/**
 * 예전의 아홉 프리셋에서 1:1 로 뽑았습니다. 프리셋마다 슬롯 템플릿이 서로 달라 하나로
 * 합칠 수 없었습니다. 그 뒤 프리셋은 프레임 전용 다섯 개로 줄었지만 이 목록은 그대로
 * 둡니다. 없어진 프리셋이 보여 주던 문구 구성이 여기 남아 있어야 사라지지 않습니다.
 *
 * 거기에 둘을 더했습니다.
 *
 * one-block 은 프리셋에서 뽑은 것이 아니라 사용자가 신고한 요구를 채우려고 만든
 * 것입니다. 좌우로 나뉜 배치에서 한 덩이로 바꿀 때 렌즈 정보가 사라지지 않는 배치가
 * 하나도 없었습니다. 뽑아 온 단일 배치 셋은 모두 렌즈 토큰을 담고 있지 않습니다.
 *
 * exposure-gear 도 마찬가지로 신고를 채우려고 만들었습니다. 기본 배치 body-lens 는
 * 오른쪽에 렌즈 정보를 두는데, 렌즈 EXIF 가 없는 사진이 흔해 그 자리가 통째로 빕니다.
 * 왼쪽에 노출값과 촬영 일시, 오른쪽에 장비를 두면 둘 다 거의 언제나 값이 있어 비지
 * 않습니다.
 */
export const ARRANGEMENTS: readonly Arrangement[] = [
  {
    id: 'body-lens',
    labelKey: 'arrangement.body-lens',
    layouts: ['bar'],
    values: {
      MODE: 'split',
      ALIGN: 'center',
      DIVIDER: '·',
      PRIMARY_MAIN: '{MAKER}',
      PRIMARY_SUB: '{BODY}',
      SECONDARY_MAIN: '{LENS_MAKER}',
      SECONDARY_SUB: '{LENS}',
      FOOTER: '{MM}{F}{SEC}{ISO}',
    },
  },
  {
    id: 'gear-exposure',
    labelKey: 'arrangement.gear-exposure',
    layouts: ['bar'],
    values: {
      MODE: 'split',
      ALIGN: 'center',
      DIVIDER: '·',
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '{LENS}',
      SECONDARY_MAIN: '{MM}{F}',
      SECONDARY_SUB: '{SEC}{ISO}',
      FOOTER: '',
    },
  },
  {
    id: 'one-line',
    labelKey: 'arrangement.one-line',
    layouts: ['bar'],
    values: {
      MODE: 'single',
      ALIGN: 'center',
      DIVIDER: '·',
      PRIMARY_MAIN: '{MAKER}{BODY}{MM}{F}{SEC}{ISO}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      FOOTER: '',
    },
  },
  {
    id: 'shot-on',
    labelKey: 'arrangement.shot-on',
    layouts: ['bar'],
    values: {
      MODE: 'single',
      ALIGN: 'center',
      DIVIDER: '·',
      PRIMARY_MAIN: 'Shot on {MAKER}{BODY}',
      PRIMARY_SUB: '{MM}{F}{SEC}{ISO}',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      FOOTER: '',
    },
  },
  {
    id: 'minimal',
    labelKey: 'arrangement.minimal',
    layouts: ['bar'],
    values: {
      MODE: 'single',
      ALIGN: 'left',
      DIVIDER: '',
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      FOOTER: '',
    },
  },
  {
    id: 'film',
    labelKey: 'arrangement.film',
    layouts: ['bar'],
    values: {
      MODE: 'split',
      ALIGN: 'center',
      DIVIDER: '',
      PRIMARY_MAIN: '{TAKEN_AT}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      FOOTER: '',
    },
  },
  {
    id: 'polaroid',
    labelKey: 'arrangement.polaroid',
    layouts: ['matte'],
    values: {
      MODE: 'split',
      ALIGN: 'center',
      DIVIDER: '·',
      PRIMARY_MAIN: '{MAKER}{BODY}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      // 하단 바에만 있는 자리입니다. 여백 액자는 이 값을 쓰지 않습니다.
      FOOTER: '',
    },
  },
  {
    id: 'letterbox',
    labelKey: 'arrangement.letterbox',
    layouts: ['matte'],
    values: {
      MODE: 'single',
      ALIGN: 'center',
      DIVIDER: '·',
      PRIMARY_MAIN: '{MAKER}{BODY}{MM}{F}',
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MM}{F}{SEC}{ISO}',
      SECONDARY_SUB: '',
      FOOTER: '',
    },
  },
  {
    id: 'poster',
    labelKey: 'arrangement.poster',
    // matte 전용입니다. bar.ts 에는 poster 분기가 없어 else 로 떨어져 split 처럼
    // 그려지므로, layouts 에 'bar' 를 넣지 않는 것이 그 오작동을 막는 유일한 방어선입니다.
    layouts: ['matte'],
    values: {
      MODE: 'poster',
      ALIGN: 'left',
      DIVIDER: '·',
      PRIMARY_MAIN: '{TAKEN_AT}',
      // 지금 모습을 유지합니다. 비우면 세 줄이 아니라 두 줄로 접히고 SUB_SCALE 이
      // 아무 효과가 없지만, 이 작업은 배치와 프레임의 축을 나누는 구조 변경이지 poster
      // 프리셋의 모습을 바꾸는 작업이 아닙니다. 세 줄로 채우는 것은 별도 판단이 필요합니다.
      PRIMARY_SUB: '',
      SECONDARY_MAIN: '{MAKER}{BODY}{MM}',
      SECONDARY_SUB: '',
      FOOTER: '',
    },
  },
  {
    id: 'one-block',
    labelKey: 'arrangement.one-block',
    // 꼬리 줄을 쓰지 않고 single 모드만 쓰므로 두 레이아웃 모두에서 뜻이 통합니다.
    layouts: ['bar', 'matte'],
    values: {
      MODE: 'single',
      ALIGN: 'center',
      DIVIDER: '·',
      // 좌우로 나뉜 배치에서 넘어와도 잃는 정보가 없도록 장비와 노출을 모두 담습니다.
      PRIMARY_MAIN: '{MAKER}{BODY}{LENS}',
      PRIMARY_SUB: '{MM}{F}{SEC}{ISO}',
      SECONDARY_MAIN: '',
      SECONDARY_SUB: '',
      FOOTER: '',
    },
  },
  {
    id: 'exposure-gear',
    labelKey: 'arrangement.exposure-gear',
    // bar 전용입니다. one-block 처럼 두 레이아웃 모두에서 뜻은 통하지만, 이 배치는
    // bar 레이아웃의 기본값이기도 합니다. matte 에도 넣으면, 사진을 막 불러와 아직
    // 아무 배치도 고르지 않은 사용자가 matte 계열 프리셋(폴라로이드, 레터박스, 포스터)
    // 을 눌렀을 때 arrangementForLayout 이 "지금 배치를 쓸 수 있으면 그대로 둔다"는
    // 규칙에 따라 이 배치를 그대로 유지해 버립니다. 그러면 포스터 프리셋이 세 줄을
    // 위아래로 쌓는 자기 모습 대신 좌우로 나뉜 모습으로 뜹니다. one-block 은 기본값이
    // 아니라 사용자가 일부러 고른 것이라 이 문제가 없습니다. bar 전용으로 좁혀
    // 프리셋의 모습이 그대로 남게 합니다.
    layouts: ['bar'],
    values: {
      MODE: 'split',
      ALIGN: 'center',
      DIVIDER: '·',
      // 노출값과 촬영 일시는 렌즈와 달리 거의 모든 사진에 있습니다. 왼쪽을 이 둘로
      // 채우고 오른쪽에 장비를 두면, 렌즈 EXIF 가 없는 사진에서도 바 한쪽이
      // 통째로 비지 않습니다.
      //
      // 촬영 일시를 주 줄, 노출값 넷을 부 줄에 둡니다. 처음에는 반대로 두었는데
      // 실제 세로 사진(니콘 D750)으로 확인해 보니 주 줄 크기에서 "ISO 200 · 80mm ·
      // f/5.6 · 1/500s"가 세로 사진의 좁은 반쪽 폭(425u)보다 넓어(499u) 말줄임표로
      // 잘렸습니다. 부 줄 크기(주 줄의 0.7배)에서는 349u로 여유 있게 들어갑니다.
      // 가로 사진에서만 확인하고 넘어갔다면 놓쳤을 결함이라 세로도 반드시 함께
      // 봐야 합니다.
      PRIMARY_MAIN: '{TAKEN_AT}',
      PRIMARY_SUB: '{ISO}{MM}{F}{SEC}',
      SECONDARY_MAIN: '{MAKER}{BODY}',
      SECONDARY_SUB: '{LENS}',
      FOOTER: '',
    },
  },
];

/**
 * 레이아웃마다의 기본 배치입니다. 새 사진이 처음 들어올 때와, 지금 배치를 새 프레임의
 * 레이아웃에서 쓸 수 없을 때 씁니다.
 *
 * 프리셋은 배치를 가리키지 않습니다. 프리셋마다 배치를 하나씩 달아 두었더니 두 목록이
 * 거울처럼 보여 같은 일을 하는 것으로 읽혔고, 프레임을 고르는 것이 배치까지 바꾸면 두
 * 칸의 역할이 다시 섞입니다. 그래서 배치의 출발점을 프리셋이 아니라 레이아웃에 답니다.
 *
 * bar 는 body-lens 가 아니라 exposure-gear 를 가리킵니다. body-lens 는 오른쪽에 렌즈
 * 정보를 두는데, 렌즈 EXIF 가 없는 사진에서는 그 자리가 통째로 빕니다. 처음 여는
 * 사람이 보는 화면이 비어 있지 않도록 노출값과 장비를 양쪽에 나눠 두는 배치를
 * 기본으로 둡니다.
 */
export const DEFAULT_ARRANGEMENT_BY_LAYOUT: Record<'bar' | 'matte', string> = {
  bar: 'exposure-gear',
  matte: 'polaroid',
};

/** 저장된 설정에 없는 id 가 남아 있어도 화면이 비지 않도록 기본값으로 떨어집니다. */
export function arrangementById(id: string): Arrangement {
  return ARRANGEMENTS.find((arrangement) => arrangement.id === id) ?? ARRANGEMENTS[0]!;
}

/**
 * 그 레이아웃에서 쓸 수 있는 배치를 돌려줍니다. 지금 배치를 쓸 수 있으면 그대로 두고,
 * 쓸 수 없거나 목록에 없는 id 면 그 레이아웃의 기본 배치로 떨어집니다. 프레임을 바꿔도
 * 배치가 따라 바뀌지 않게 하는 자리입니다.
 */
export function arrangementForLayout(
  id: string | undefined,
  layout: 'bar' | 'matte',
): Arrangement {
  const found = id === undefined ? undefined : ARRANGEMENTS.find((a) => a.id === id);
  if (found && found.layouts.includes(layout)) return found;
  return arrangementById(DEFAULT_ARRANGEMENT_BY_LAYOUT[layout]);
}

/**
 * 배치가 정하는 여덟 값을 넘겨줍니다. 이 자리가 배치를 적용하는 유일한 자리입니다.
 *
 * `Arrangement.layouts` 가 곧 유일한 방어선입니다. `MODE` 를 개별 옵션이 아니라 배치가
 * 통째로 밀어 넣으면, `BAR_OPTIONS` 의 select 목록이 `poster` 를 막아 주던 관문을
 * 우회하게 됩니다. bar.ts 에는 poster 분기가 없어 걸러지지 않은 `MODE='poster'` 는
 * else 로 떨어져 split 처럼 그려지므로, 여기서 미리 막습니다.
 */
export function arrangementValuesFor(
  arrangement: Arrangement,
  layout: 'bar' | 'matte',
): Arrangement['values'] {
  if (!arrangement.layouts.includes(layout)) {
    throw new Error(`배치 ${arrangement.id}은 ${layout} 레이아웃에서 쓸 수 없습니다`);
  }
  return arrangement.values;
}
