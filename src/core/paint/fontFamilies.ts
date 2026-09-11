export interface CanvasFont {
  id: string;
  /** 설정 화면에 보일 이름입니다. */
  label: string;
  /** FontFace에 등록할 이름입니다. 시스템 폰트와 겹치지 않도록 접두사를 붙입니다. */
  family: string;
  /** 등록이 실패해도 글자가 아예 안 나오지는 않도록 두는 일반 계열입니다. */
  fallback: string;
  /** 네 종류 모두 가변 굵기라 굵기 옵션이 서체와 무관하게 같게 동작합니다. */
  weightRange: string;
}

export const CANVAS_FONTS: readonly CanvasFont[] = [
  { id: 'inter', label: 'Inter', family: 'HalfstopInter', fallback: 'sans-serif', weightRange: '100 900' },
  { id: 'literata', label: 'Literata', family: 'HalfstopLiterata', fallback: 'serif', weightRange: '200 900' },
  { id: 'jetbrains-mono', label: 'JetBrains Mono', family: 'HalfstopJetBrainsMono', fallback: 'monospace', weightRange: '100 800' },
  { id: 'pretendard', label: 'Pretendard (한글)', family: 'HalfstopPretendard', fallback: 'sans-serif', weightRange: '45 920' },
];

export const FONT_IDS: readonly string[] = CANVAS_FONTS.map((font) => font.id);
/**
 * 기본 서체입니다. 사용자가 Inter 를 별로라고 해서 Pretendard 로 바꿨습니다.
 *
 * 두 가지를 알고 고른 값입니다. 첫째, Pretendard 의 라틴 글자는 Inter 를 바탕으로 다듬은
 * 것이라 촬영 정보(전부 라틴)의 모습이 크게 달라지지는 않습니다. 실제로 같은 문장을 두
 * 서체로 그려 나란히 보고 확인했습니다. 둘째, 이 파일만 한글을 포함해 2MB 입니다. 서체는
 * FontFace 로 비동기로 붙고 준비되면 usePipeline 이 다시 그리므로, 그 사이에는 대체
 * 서체로 한 번 그려집니다. 모든 서체가 이미 그 길을 탑니다.
 *
 * 대신 얻는 것이 있습니다. 작가 이름에 한글을 쳐도 기기에 무엇이 깔렸는지와 무관하게
 * 같은 글자가 나옵니다. 라틴 서브셋인 나머지 셋은 그 글자를 시스템 서체로 흘립니다.
 */
export const DEFAULT_FONT_ID = 'pretendard';

/** 저장된 설정에 없는 id가 들어와도 화면이 비지 않도록 기본값으로 되돌립니다. */
export function fontById(id: string): CanvasFont {
  return CANVAS_FONTS.find((font) => font.id === id) ?? CANVAS_FONTS[0]!;
}

export function fontStack(font: CanvasFont): string {
  return `${font.family}, ${font.fallback}`;
}
