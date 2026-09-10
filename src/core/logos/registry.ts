import { LOGOS, type LogoArt, type LogoPart } from './logoData';

/**
 * 로고가 없으면 false 를 돌려줍니다. LayoutServices.hasLogo 가 바로 이 함수이고, layout()
 * 이 이 값을 보고 로고 노드 대신 워드마크(text 노드)를 만들지 정합니다.
 */
export function hasLogo(id: string): boolean {
  return LOGOS.some((logo) => logo.id === id);
}

/**
 * 로고를 이루는 조각들과 viewBox 를 돌려줍니다. Path2D 를 여기서 만들지 않습니다.
 * Path2D 는 브라우저 API 라 src/core/ 가 environment: 'node' 테스트를 도는 데
 * 걸림돌이 되기 때문입니다. Path2D 로 만드는 일은 그리는 쪽(usePipeline.ts,
 * render.worker.ts)에서 합니다. 조각의 transform 도 그쪽에서 DOMMatrix 로 적용합니다.
 */
export function logoParts(
  id: string,
): { parts: readonly LogoPart[]; viewBox: LogoArt['viewBox'] } | undefined {
  const logo = LOGOS.find((entry) => entry.id === id);
  if (!logo) return undefined;
  return { parts: logo.parts, viewBox: logo.viewBox };
}

export interface FitBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * 로고는 viewBox 좌표계로 그려져 있고 노드는 상자를 디자인 단위로 줍니다. 이 함수가
 * viewBox 를 그 상자 안에 가로세로 비를 지키며 가운데 정렬로 넣을 때 필요한 배율과
 * 위치를 계산합니다. 순수 함수라 Path2D 없이도 테스트할 수 있습니다.
 *
 * 상자보다 로고의 종횡비가 다르면 한쪽 축에 여백(letterbox)이 남고, 그 여백을 절반씩
 * 나눠 가운데에 둡니다.
 */
export function fitLogoBox(
  viewBox: { width: number; height: number },
  box: { width: number; height: number },
): FitBox {
  const scale = Math.min(box.width / viewBox.width, box.height / viewBox.height);
  const width = viewBox.width * scale;
  const height = viewBox.height * scale;
  return {
    x: (box.width - width) / 2,
    y: (box.height - height) / 2,
    width,
    height,
  };
}
