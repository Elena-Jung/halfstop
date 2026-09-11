import { LOGOS, type LogoArt } from './logoData';

/**
 * 로고가 없으면 false 를 돌려줍니다. LayoutServices.hasLogo 가 바로 이 함수이고, layout()
 * 이 이 값을 보고 로고 노드 대신 워드마크(text 노드)를 만들지 정합니다.
 */
export function hasLogo(id: string): boolean {
  return LOGOS.some((logo) => logo.id === id);
}

/**
 * 로고의 명세를 돌려줍니다. 그림 파일을 실제로 받아 오는 일은 `src/images/logoImages.ts`
 * 의 몫입니다. `src/core/` 는 fetch 를 쓰지 않으므로 여기서는 파일 이름과 픽셀 크기까지만
 * 압니다. layout() 이 상자 비율을 정하는 데 그 크기를 씁니다.
 */
export function logoArt(id: string): LogoArt | undefined {
  return LOGOS.find((logo) => logo.id === id);
}

export interface FitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 로고는 저마다 가로세로 비가 다르고(핫셀블라드는 12.8:1, 니콘은 1:1) 노드는 상자를
 * 디자인 단위로 줍니다. 이 함수가 그림을 그 상자 안에 가로세로 비를 지키며 가운데
 * 정렬로 넣을 때 필요한 크기와 위치를 계산합니다. 순수 함수라 비트맵 없이도 테스트할 수
 * 있고, 그래서 layout() 안에서 부를 수 있습니다.
 *
 * 상자보다 로고의 종횡비가 다르면 한쪽 축에 여백(letterbox)이 남고, 그 여백을 절반씩
 * 나눠 가운데에 둡니다. 상자 자체의 크기는 브랜드와 무관하게 일정해야 브랜드가 다른
 * 사진 사이에서 옆 글줄이 흔들리지 않습니다.
 */
export function fitLogoBox(
  art: { width: number; height: number },
  box: { width: number; height: number },
): FitBox {
  const scale = Math.min(box.width / art.width, box.height / art.height);
  const width = art.width * scale;
  const height = art.height * scale;
  return {
    x: (box.width - width) / 2,
    y: (box.height - height) / 2,
    width,
    height,
  };
}
