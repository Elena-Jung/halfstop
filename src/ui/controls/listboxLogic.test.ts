import { describe, expect, it } from 'vitest';
import { initialActiveIndex, listPosition, typeaheadIndex, wrapIndex } from './listboxLogic';

describe('wrapIndex', () => {
  it('보통은 델타만큼 옮깁니다', () => {
    expect(wrapIndex(1, 3, 1)).toBe(2);
    expect(wrapIndex(1, 3, -1)).toBe(0);
  });

  it('마지막에서 다음은 처음으로 감깁니다', () => {
    expect(wrapIndex(2, 3, 1)).toBe(0);
  });

  it('처음에서 이전은 마지막으로 감깁니다', () => {
    expect(wrapIndex(0, 3, -1)).toBe(2);
  });

  it('목록이 비어 있으면 null 입니다', () => {
    expect(wrapIndex(0, 0, 1)).toBeNull();
  });
});

describe('initialActiveIndex', () => {
  it('지금 값이 있는 자리를 가리킵니다', () => {
    expect(initialActiveIndex(['split', 'single', 'poster'], 'single')).toBe(1);
  });

  it('지금 값이 목록에 없으면 첫 항목을 가리킵니다', () => {
    expect(initialActiveIndex(['split', 'single', 'poster'], 'stale-value')).toBe(0);
  });

  it('목록이 비어 있으면 null 입니다', () => {
    expect(initialActiveIndex([], 'a')).toBeNull();
  });
});

describe('typeaheadIndex', () => {
  const fonts = ['Inter', 'Literata', 'JetBrains Mono', 'Pretendard'];

  it('지금 항목 다음부터 그 글자로 시작하는 항목을 찾습니다', () => {
    // activeIndex 0(Inter) 다음부터 찾으면 1(Literata) 은 l 로 시작하지 않고, 'p' 로 시작하는
    // 것은 인덱스 3(Pretendard) 뿐입니다.
    expect(typeaheadIndex(fonts, 'p', 0)).toBe(3);
  });

  it('끝까지 못 찾으면 처음으로 감깁니다', () => {
    // activeIndex 2(JetBrains Mono) 다음부터 찾으면 3(Pretendard) 은 아니고, 감겨서
    // 0(Inter) 이 'i' 로 시작하는 첫 항목입니다.
    expect(typeaheadIndex(fonts, 'i', 2)).toBe(0);
  });

  it('시작하는 항목이 없으면 null 입니다', () => {
    expect(typeaheadIndex(fonts, 'z', 0)).toBeNull();
  });

  it('같은 글자를 반복하면 그 글자로 시작하는 항목을 하나씩 순환합니다', () => {
    const berries = ['Banana', 'Berry', 'Cherry', 'Blueberry'];
    // activeIndex 0(Banana) 에서 'bb' 는 반복이므로 쿼리는 'b' 하나입니다. 다음부터 찾으면
    // 1(Berry) 이 먼저 걸립니다.
    expect(typeaheadIndex(berries, 'bb', 0)).toBe(1);
    // activeIndex 1(Berry) 에서 다시 'bbb' 를 누르면 2(Cherry) 는 건너뛰고 3(Blueberry) 이
    // 다음으로 걸립니다.
    expect(typeaheadIndex(berries, 'bbb', 1)).toBe(3);
  });

  it('여러 글자를 이어 누르면 buffer 전체를 앞부분으로 찾습니다', () => {
    // 'in' 은 반복 글자가 아니므로 그대로 앞부분 비교에 씁니다. Inter 만 걸립니다.
    expect(typeaheadIndex(fonts, 'in', 0)).toBe(0);
  });

  it('대소문자를 가리지 않습니다', () => {
    expect(typeaheadIndex(fonts, 'PRETEND', 0)).toBe(3);
  });
});

describe('listPosition', () => {
  it('아래에 자리가 넉넉하면 트리거 아래에 둡니다', () => {
    expect(listPosition({ left: 100, top: 200, bottom: 232, width: 280 }, 220, 900, 4)).toEqual({
      left: 100,
      top: 236,
      width: 280,
      placement: 'bottom',
    });
  });

  it('아래가 모자라고 위에 자리가 있으면 위로 뒤집습니다', () => {
    expect(listPosition({ left: 100, top: 300, bottom: 332, width: 280 }, 220, 400, 4)).toEqual({
      left: 100,
      top: 76,
      width: 280,
      placement: 'top',
    });
  });

  it('위아래 모두 모자라면 뒤집지 않습니다. 뒤집어도 나아지지 않습니다', () => {
    expect(listPosition({ left: 0, top: 10, bottom: 42, width: 280 }, 500, 400, 4)).toEqual({
      left: 0,
      top: 46,
      width: 280,
      placement: 'bottom',
    });
  });
});
