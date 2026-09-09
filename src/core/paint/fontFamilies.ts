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
export const DEFAULT_FONT_ID = 'inter';

/** 저장된 설정에 없는 id가 들어와도 화면이 비지 않도록 기본값으로 되돌립니다. */
export function fontById(id: string): CanvasFont {
  return CANVAS_FONTS.find((font) => font.id === id) ?? CANVAS_FONTS[0]!;
}

export function fontStack(font: CanvasFont): string {
  return `${font.family}, ${font.fallback}`;
}
