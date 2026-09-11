/**
 * 브랜드 카메라와 렌즈 로고 그림의 명세입니다. 그림 자체는 `public/logos/` 아래의 PNG 이고
 * 여기에는 그 파일을 찾고 자리를 잡는 데 필요한 값만 둡니다.
 *
 * 한때는 브랜드 SVG 에서 path 의 d 를 뽑아 단색 실루엣으로 그렸습니다. 워커에
 * HTMLImageElement 가 없어 SVG 를 이미지로 그릴 수 없다는 제약 때문이었습니다. 그 제약
 * 안에서는 니콘의 노란 상자와 구글의 네 색을 표현할 수 없었고, 실루엣에 브랜드 색을 칠하면
 * 노란 글자가 되어 흰 바탕에서 보이지 않았습니다. PNG 를 fetch 로 받아 createImageBitmap
 * 으로 만들면 워커 안에서도 색이 그대로 살아난다는 것을 확인해 그림째로 들고 오는 쪽으로
 * 바꿨습니다.
 *
 * `width` 와 `height` 는 PNG 의 실제 픽셀 크기입니다. `layout()` 은 순수 함수라 아직 받아
 * 오지도 않은 비트맵을 볼 수 없으므로, 그려질 크기를 정하는 가로세로 비를 이 값에서 뽑아야
 * 배치가 결정적입니다. `logoData.test.ts` 가 파일에서 직접 읽어 이 값과 대조합니다.
 *
 * 스물다섯 개 전부 퍼블릭 도메인입니다. 다만 브랜드 로고는 등록상표이므로, 나중에
 * 브랜드별로 빼거나 갈아 끼울 수 있도록 코드가 아니라 데이터로 둡니다.
 */
export interface LogoArt {
  /** 브랜드 식별자입니다. 소문자와 하이픈, 숫자만 씁니다. */
  id: string;
  /** `public/logos/` 아래의 파일 이름입니다. */
  file: string;
  /** PNG 의 실제 픽셀 크기입니다. 그려질 폭을 정하는 가로세로 비가 여기서 나옵니다. */
  width: number;
  height: number;
  /** 어디서 가져왔고 어떤 라이선스인지입니다. 지우지 마십시오. */
  source: string;
  license: string;
  /**
   * 잉크가 무채색 검정이라 검은 바탕에서 사라지는 로고입니다. 그리는 쪽이 어두운 잉크만
   * 글자색으로 물들입니다. 니콘의 노란 상자나 구글의 네 색처럼 색 자체가 뜻을 갖는 로고는
   * false 이고 손대지 않고 그대로 그립니다. 어느 브랜드가 어느 쪽인지는 이 칸만 보면
   * 되도록, 부르는 쪽이 id 를 늘어놓지 않습니다.
   */
  darkInk: boolean;
}

export const LOGOS: readonly LogoArt[] = [
  {
    id: 'sony',
    file: 'sony.png',
    width: 512,
    height: 90,
    source: 'https://commons.wikimedia.org/wiki/File:Sony_logo.svg',
    license: 'Public domain',
    darkInk: true,
  },
  {
    id: 'nikon',
    file: 'nikon.png',
    width: 512,
    height: 512,
    source: 'https://commons.wikimedia.org/wiki/File:Nikon_Logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'fujifilm',
    file: 'fujifilm.png',
    width: 512,
    height: 85,
    source: 'https://commons.wikimedia.org/wiki/File:Fujifilm_logo.svg',
    license: 'Public domain',
    darkInk: true,
  },
  {
    id: 'panasonic',
    file: 'panasonic.png',
    width: 512,
    height: 78,
    source: 'https://commons.wikimedia.org/wiki/File:Panasonic_logo_(Blue).svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'leica',
    file: 'leica.png',
    width: 512,
    height: 512,
    source: 'https://commons.wikimedia.org/wiki/File:Leica_Camera_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'apple',
    file: 'apple.png',
    width: 417,
    height: 512,
    source: 'https://commons.wikimedia.org/wiki/File:Apple_logo_black.svg',
    license: 'Public domain',
    darkInk: true,
  },
  {
    id: 'samsung',
    file: 'samsung.png',
    width: 512,
    height: 79,
    source: 'https://commons.wikimedia.org/wiki/File:Samsung_wordmark.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'google',
    file: 'google.png',
    width: 512,
    height: 169,
    source: 'https://commons.wikimedia.org/wiki/File:Google_2015_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'dji',
    file: 'dji.png',
    width: 512,
    height: 296,
    source: 'https://commons.wikimedia.org/wiki/File:DJI_Innovations_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'xiaomi',
    file: 'xiaomi.png',
    width: 512,
    height: 512,
    source: 'https://commons.wikimedia.org/wiki/File:Xiaomi_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'pentax',
    file: 'pentax.png',
    width: 512,
    height: 100,
    source: 'https://commons.wikimedia.org/wiki/File:Pentax_Logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'sigma',
    file: 'sigma.png',
    width: 512,
    height: 109,
    source: 'https://commons.wikimedia.org/wiki/File:SIGMA_CORPORATION.svg',
    license: 'Public domain',
    darkInk: true,
  },
  {
    id: 'tamron',
    file: 'tamron.png',
    width: 512,
    height: 79,
    source: 'https://commons.wikimedia.org/wiki/File:Tamron_Logo_2019.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'tokina',
    file: 'tokina.png',
    width: 512,
    height: 77,
    source: 'https://commons.wikimedia.org/wiki/File:Tokina_Logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'laowa',
    file: 'laowa.png',
    width: 512,
    height: 129,
    source: 'https://commons.wikimedia.org/wiki/File:Laowa_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'canon',
    file: 'canon.png',
    width: 512,
    height: 107,
    source: 'https://commons.wikimedia.org/wiki/File:Canon_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'ricoh',
    file: 'ricoh.png',
    width: 512,
    height: 93,
    source: 'https://commons.wikimedia.org/wiki/File:Ricoh_logo_2005.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'olympus',
    file: 'olympus.png',
    width: 512,
    height: 97,
    source: 'https://commons.wikimedia.org/wiki/File:Olympus_Corporation_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'hasselblad',
    file: 'hasselblad.png',
    width: 512,
    height: 40,
    source: 'https://commons.wikimedia.org/wiki/File:Hasselblad_logo.svg',
    license: 'Public domain',
    darkInk: true,
  },
  {
    id: 'om-system',
    file: 'om-system.png',
    width: 512,
    height: 512,
    source: 'https://commons.wikimedia.org/wiki/File:OMDS_OM-System-Logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'zeiss',
    file: 'zeiss.png',
    width: 512,
    height: 512,
    source: 'https://commons.wikimedia.org/wiki/File:Zeiss_logo.svg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'gopro',
    file: 'gopro.png',
    width: 512,
    height: 70,
    source: 'https://commons.wikimedia.org/wiki/File:GoPro_logo_light.svg',
    license: 'Public domain',
    darkInk: true,
  },
  {
    id: 'voigtlander',
    file: 'voigtlander.png',
    width: 512,
    height: 125,
    source: 'https://commons.wikimedia.org/wiki/File:Voigtlaender_logo_blau.jpg',
    license: 'Public domain',
    darkInk: false,
  },
  {
    id: 'viltrox',
    file: 'viltrox.png',
    width: 512,
    height: 91,
    source: 'https://commons.wikimedia.org/wiki/File:Viltrox_logo_black.png',
    license: 'Public domain',
    darkInk: true,
  },
  {
    id: 'samyang',
    file: 'samyang.png',
    width: 512,
    height: 90,
    source: 'https://commons.wikimedia.org/wiki/File:Samyang_logo.png',
    license: 'Public domain',
    darkInk: false,
  },
];
