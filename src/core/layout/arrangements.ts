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
 * 아홉 프리셋에서 1:1 로 뽑았습니다. 프리셋마다 슬롯 템플릿이 서로 달라 하나로 합칠 수
 * 없었습니다. 비슷한 배치를 묶는 것은 이 작업의 범위 밖이고 나중에 따로 판단합니다.
 *
 * 거기에 one-block 하나를 더했습니다. 프리셋에서 뽑은 것이 아니라 사용자가 신고한 요구를
 * 채우려고 만든 것입니다. 좌우로 나뉜 배치에서 한 덩이로 바꿀 때 렌즈 정보가 사라지지 않는
 * 배치가 하나도 없었습니다. 뽑아 온 단일 배치 셋은 모두 렌즈 토큰을 담고 있지 않습니다.
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
];

export const DEFAULT_ARRANGEMENT_ID = 'body-lens';

/** 저장된 설정에 없는 id 가 남아 있어도 화면이 비지 않도록 기본값으로 떨어집니다. */
export function arrangementById(id: string): Arrangement {
  return ARRANGEMENTS.find((arrangement) => arrangement.id === id) ?? ARRANGEMENTS[0]!;
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
