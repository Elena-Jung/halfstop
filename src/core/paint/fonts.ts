import type { CanvasFont } from './fontFamilies';

export interface FontFaceLike {
  family: string;
  load(): Promise<unknown>;
}

export interface FontFaceSetLike extends Iterable<FontFaceLike> {
  add(face: FontFaceLike): void;
}

export type FontFaceFactory = (
  family: string,
  source: string,
  descriptors: { weight: string },
) => FontFaceLike;

const defaultFactory: FontFaceFactory = (family, source, descriptors) =>
  new FontFace(family, source, descriptors) as unknown as FontFaceLike;

/**
 * 메인 스레드는 document.fonts를, 워커는 self.fonts를 넘깁니다. 두 스레드가
 * 각자 등록해야 같은 서체로 그려집니다. 반드시 이 프라미스를 기다린 뒤에
 * measureText와 paint를 부릅니다. 기다리지 않으면 첫 렌더가 대체 서체로 나갑니다.
 */
export async function ensureCanvasFont(
  fonts: FontFaceSetLike,
  font: CanvasFont,
  url: string,
  create: FontFaceFactory = defaultFactory,
): Promise<void> {
  for (const registered of fonts) {
    if (registered.family === font.family) return;
  }

  const face = create(font.family, `url(${url}) format('woff2')`, { weight: font.weightRange });
  await face.load();
  fonts.add(face);
}
