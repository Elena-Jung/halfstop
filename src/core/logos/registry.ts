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
 * 압니다. layout() 이 그릴 크기를 정하는 데 그 가로세로 비를 씁니다.
 */
export function logoArt(id: string): LogoArt | undefined {
  return LOGOS.find((logo) => logo.id === id);
}

/**
 * 마크 자리(높이 markHeight)에 로고를 놓을 때의 크기와 세로 치우침입니다. `y` 는 그 자리의
 * 위끝에서 그림 위끝까지의 거리입니다.
 */
export interface LogoMark {
  /** 그려질 폭입니다. 마크가 예약하는 폭이기도 합니다. */
  width: number;
  /** 그려질 높이입니다. 상한에 걸리지 않으면 markHeight 그대로입니다. */
  height: number;
  y: number;
}

/**
 * 로고의 폭이 markHeight 의 몇 배까지 갈 수 있는지입니다.
 *
 * 로고 스물다섯 개의 가로세로 비는 정사각(니콘, 라이카)부터 12.8대 1(핫셀블라드)까지
 * 벌어져 있고, 워드마크 대부분은 4.7 에서 6.6 사이에 몰려 있습니다. 상한을 그 무리보다
 * 낮게 잡으면 소니와 캐논까지 폭에 걸려 높이가 깎이므로, 무리 전체를 담는 6 으로
 * 두었습니다. 상한을 넘는 것은 핫셀블라드와 고프로 둘뿐이고 그 둘만 높이를 내줍니다.
 */
export const LOGO_MAX_ASPECT = 6;

/**
 * 마크가 프레임 폭에서 가져갈 수 있는 몫입니다. 가로세로 비 상한만으로는 세로 사진을
 * 지키지 못합니다. 프레임 폭이 가로 사진의 3분의 2라 같은 로고가 그만큼 큰 몫을 먹고,
 * 좌우로 나눈 슬롯이 좁아져 노출 줄이 잘립니다. 실제로 소니 로고를 켠 세로 사진에서
 * 0.16 은 세로 사진(프레임 폭 1000u)에서 160u 입니다. 가로 사진(1500u)에서는 240u 라
 * 소니(232u)가 걸리지 않아 사용자가 이미 보고 정한 가로 모습이 그대로 남고, 세로에서만
 * 조입니다. 실제 사진으로 두 방향을 모두 그려 확인한 값입니다.
 */
export const LOGO_WIDTH_SHARE = 0.16;

/**
 * 로고를 그릴 크기를 정합니다. **높이를 markHeight 로 못박고 폭이 가로세로 비를
 * 따릅니다.** 로고의 높이가 브랜드와 무관하게 일정해야 옆 글자와 나란히 읽힙니다.
 *
 * 한때는 가로세로 1.5대 1 상자에 그림을 맞춰 넣었습니다. 정사각형인 니콘만 제 높이로
 * 나오고 5.7대 1 인 소니는 상자 높이의 26% 로 뭉개졌습니다. 어떤 비율의 상자로도 1대 1 과
 * 12.8대 1 을 함께 담을 수 없습니다.
 *
 * 폭에만 상한을 둡니다. 상한에 걸리면 그때는 폭을 기준으로 줄여 가로세로 비를 지키고,
 * 줄어든 만큼 남는 높이를 위아래로 반씩 나눠 가운데에 둡니다.
 *
 * 상한이 둘입니다. 하나는 가로세로 비(LOGO_MAX_ASPECT)이고, 다른 하나는 부르는 쪽이
 * 넘기는 maxWidth 입니다. 뒤엣것은 프레임의 폭을 봅니다. 디자인 단위가 사진의 짧은 변
 * 기준이라 세로 사진은 프레임 폭이 1000u 이고 가로 사진은 1500u 인데, 같은 로고가 세로
 * 사진에서는 훨씬 큰 몫을 먹습니다. 실제로 소니 로고를 켠 세로 사진에서 노출 줄이
 * 말줄임표로 잘렸습니다.
 *
 * 그려질 폭이 브랜드마다 다른 것은 그대로 받아들입니다. 그 폭을 마크가 예약하는 폭으로도
 * 쓰므로 같은 사진 안에서는 로고를 켜고 꺼도 글줄이 흔들리지 않고, 브랜드가 다르면 장비
 * 이름도 달라 옆 글줄이 움직이는 것이 당연합니다.
 */
export function logoMark(
  art: { width: number; height: number },
  markHeight: number,
  maxWidth = Infinity,
): LogoMark {
  const aspect = art.width / art.height;
  const wanted = Math.min(aspect, LOGO_MAX_ASPECT) * markHeight;
  const width = Math.min(wanted, maxWidth);
  const height = width / aspect;
  return { width, height, y: (markHeight - height) / 2 };
}
