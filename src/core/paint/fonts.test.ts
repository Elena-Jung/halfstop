import { describe, expect, it, vi } from 'vitest';
import { fontById } from './fontFamilies';
import { ensureCanvasFont, type FontFaceLike, type FontFaceSetLike } from './fonts';

const INTER = fontById('inter');

function fakeSet(initial: FontFaceLike[] = []) {
  const faces = [...initial];
  const set: FontFaceSetLike = {
    add: (face) => {
      faces.push(face);
    },
    [Symbol.iterator]: () => faces[Symbol.iterator](),
  };
  return { set, faces };
}

function fakeFactory(load: () => Promise<unknown> = async () => undefined) {
  return vi.fn((family: string) => ({ family, load }));
}

describe('ensureCanvasFont', () => {
  it('아직 없으면 만들어서 등록합니다', async () => {
    const { set, faces } = fakeSet();
    await ensureCanvasFont(set, INTER, '/inter.woff2', fakeFactory());
    expect(faces).toHaveLength(1);
    expect(faces[0]?.family).toBe(INTER.family);
  });

  it('서체가 선언한 가변 굵기 범위로 만듭니다', async () => {
    const create = fakeFactory();
    await ensureCanvasFont(fakeSet().set, INTER, '/inter.woff2', create);
    expect(create).toHaveBeenCalledWith(INTER.family, "url(/inter.woff2) format('woff2')", {
      weight: INTER.weightRange,
    });
  });

  it('이미 등록된 서체는 다시 만들지 않습니다', async () => {
    const { set, faces } = fakeSet([{ family: INTER.family, load: async () => undefined }]);
    const create = fakeFactory();
    await ensureCanvasFont(set, INTER, '/inter.woff2', create);
    expect(create).not.toHaveBeenCalled();
    expect(faces).toHaveLength(1);
  });

  it('다른 서체가 등록돼 있어도 새로 만듭니다', async () => {
    const { set, faces } = fakeSet([{ family: 'HalfstopOther', load: async () => undefined }]);
    const create = fakeFactory();
    await ensureCanvasFont(set, INTER, '/inter.woff2', create);
    expect(create).toHaveBeenCalledOnce();
    expect(faces).toHaveLength(2);
  });

  it('로드가 끝난 뒤에 등록합니다', async () => {
    const order: string[] = [];
    const create = vi.fn((family: string) => ({
      family,
      load: async () => {
        order.push('load');
      },
    }));
    const set: FontFaceSetLike = {
      add: () => {
        order.push('add');
      },
      [Symbol.iterator]: () => [][Symbol.iterator](),
    };
    await ensureCanvasFont(set, INTER, '/inter.woff2', create);
    expect(order).toEqual(['load', 'add']);
  });

  it('로드가 실패하면 던집니다', async () => {
    const create = fakeFactory(async () => {
      throw new Error('network');
    });
    await expect(ensureCanvasFont(fakeSet().set, INTER, '/inter.woff2', create)).rejects.toThrow(
      'network',
    );
  });
});
