/** 디자인 단위입니다. 픽셀이 아닙니다. */
export type Unit = number;

/** 프리셋 옵션이 가질 수 있는 값입니다. options.ts가 이 타입을 다시 내보냅니다. */
export type OptionValue = string | number | boolean;

export interface TextStyle {
  family: string;
  size: Unit;
  weight: number;
  style: 'normal' | 'italic';
  color: string;
  align: 'left' | 'center' | 'right';
  baseline: 'top' | 'middle' | 'alphabetic' | 'bottom';
  alpha: number;
}

export type SceneNode =
  | { kind: 'rect'; x: Unit; y: Unit; w: Unit; h: Unit; fill: string; alpha: number }
  | { kind: 'image'; x: Unit; y: Unit; w: Unit; h: Unit }
  | { kind: 'text'; x: Unit; y: Unit; text: string; style: TextStyle }
  | { kind: 'logo'; x: Unit; y: Unit; w: Unit; h: Unit; logoId: string; fill: string };

export interface Scene {
  width: Unit;
  height: Unit;
  background: string;
  nodes: SceneNode[];
}

/**
 * 레이아웃이 순수하지 않게 되는 유일한 두 지점입니다. 주입해서 받습니다.
 * 덕분에 layout()은 캔버스도 DOM도 없이 테스트할 수 있습니다.
 */
export interface LayoutServices {
  /** 반환값의 단위는 디자인 단위입니다. */
  measureText(text: string, style: TextStyle): number;
  /** 로고가 없으면 false를 돌려줍니다. 프리셋은 그때 워드마크로 대체합니다. */
  hasLogo(logoId: string): boolean;
}

export type TemplateToken =
  | 'MAKER'
  | 'BODY'
  | 'LENS'
  | 'LENS_MAKER'
  | 'MM'
  | 'F'
  | 'SEC'
  | 'ISO'
  | 'TAKEN_AT';

export interface LayoutInput {
  /** 디자인 단위로 표현한 사진 크기입니다. */
  photo: { width: Unit; height: Unit };
  /** 값이 없는 항목은 undefined입니다. 템플릿에서 통째로 사라집니다. */
  fields: Partial<Record<TemplateToken, string>>;
  /** 바디 브랜드 로고 식별자입니다. 아직 정해지지 않았으면 undefined입니다. */
  logoId: string | undefined;
  options: ReadonlyMap<string, OptionValue>;
}

export type PresetLayout = (input: LayoutInput, services: LayoutServices) => Scene;
