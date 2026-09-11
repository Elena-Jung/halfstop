import type { Scene } from '../core/layout/types';
import type { LogoArt } from '../core/logos/logoData';
import { logoArt } from '../core/logos/registry';

/**
 * 브랜드 로고 PNG 를 받아 와 캔버스가 바로 그릴 수 있는 그림으로 만들어 들고 있습니다.
 *
 * **미리보기(메인 스레드)와 내보내기(워커)가 이 파일 하나를 함께 씁니다.** 한쪽만 로고를
 * 준비하면 미리보기에는 있는 로고가 받은 파일에는 없습니다. 이 앱에서 가장 비싼 버그라
 * 받아 오는 코드를 한 자리에만 둡니다. `fetch` 와 `createImageBitmap` 과
 * `OffscreenCanvas` 는 창과 워커 양쪽에 있으므로 이 파일은 두 곳에서 모두 돌아갑니다.
 *
 * `src/core/render/` 가 아니라 여기 있는 이유는 `src/core/coreBoundary.test.ts` 가
 * `src/core/` 아래의 `fetch` 를 막기 때문입니다. 워커가 조용히 죽는 것을 막는 가장 잘
 * 지켜진 규칙이라 예외를 두지 않고, `src/platform/` 이 localStorage 를 맡는 것과 같은
 * 방식으로 브라우저 API 를 쓰는 자리를 하나 더 두었습니다.
 *
 * `paintToCanvas` 는 동기 함수라 그리기 전에 그림이 준비되어 있어야 합니다. 부르는 쪽은
 * `ensureSceneLogos` 로 미리 채우고 `logoImage` 로 동기로 꺼내 씁니다. 워커가
 * `ensureCanvasFontOnce` 를 기다리는 것과 같은 자리입니다.
 */

/** `public/` 의 파일은 배포 기준 경로 아래 그대로 놓입니다. 워커에서도 같은 주소입니다. */
const LOGO_DIR = `${import.meta.env.BASE_URL}logos/`;

/**
 * 받아 둔 원본입니다. 브랜드마다 하나뿐이고 닫지 않습니다. 스물다섯 개를 한 세션에서
 * 모두 쓰는 일은 없다시피 하고, 전부 들고 있어도 디코딩된 크기의 합이 10MB 안팎이라
 * 수명을 따로 관리할 만큼 크지 않습니다. 브랜드를 바꿀 때마다 닫으면 앞뒤로 오가는
 * 사진에서 같은 파일을 되풀이해 받게 됩니다.
 */
const originals = new Map<string, ImageBitmap>();

/**
 * 물들인 결과입니다. 브랜드마다 마지막 한 색만 들고 있습니다. 색 고르개는 끄는 동안에도
 * 값을 계속 내보내므로, 색마다 쌓으면 캔버스가 수백 장 남습니다. 한 장면이 쓰는 색은
 * 언제나 하나라 마지막 것만 두면 충분합니다.
 */
const tinted = new Map<string, { fill: string; image: OffscreenCanvas }>();

/** 진행 중인 받아 오기입니다. 같은 파일을 두 번 받지 않습니다. */
const inFlight = new Map<string, Promise<void>>();

/** 이보다 밝은 픽셀은 잉크가 아니라 밝은 부분으로 봅니다. */
const DARK_INK_MAX = 128;

/** 채널 차가 이보다 크면 색 자체가 뜻을 갖는 픽셀입니다. 후지필름의 빨강이 여기 걸립니다. */
const INK_CHROMA_MAX = 32;

function context(canvas: OffscreenCanvas): OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('로고용 2D 컨텍스트를 만들지 못했습니다');
  return ctx;
}

/**
 * 색 문자열을 채널 값으로 바꿉니다. 직접 파싱하지 않고 한 픽셀을 칠해 되읽습니다.
 * TEXT_COLOR 는 지금 #rrggbb 뿐이지만, 파서를 따로 두면 그 가정이 코드에 박힙니다.
 */
function inkOf(fill: string): [number, number, number] {
  const ctx = context(new OffscreenCanvas(1, 1));
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, 1, 1);
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return [data[0] ?? 0, data[1] ?? 0, data[2] ?? 0];
}

/**
 * 어두운 무채색 잉크만 골라 글자색으로 옮깁니다. 알파는 건드리지 않아 가장자리의
 * 부드러움이 그대로 남습니다.
 *
 * 통째로 덮지 않는 이유는 후지필름입니다. 그 로고는 검은 글자와 빨간 조각이 함께 있어
 * 통째로 물들이면 빨강까지 글자색이 됩니다. 스물다섯 개의 픽셀을 직접 세어 보니 검은
 * 글자는 (0,0,0), 빨강은 (237,26,58) 이라 채도로 깨끗이 갈립니다. 잉크가 무채색인
 * 나머지 여섯(시그마는 (1,1,1), 핫셀블라드는 (55,53,53))은 통째로 물들인 것과 결과가
 * 같습니다.
 */
function tintDarkInk(source: ImageBitmap, fill: string): OffscreenCanvas {
  const canvas = new OffscreenCanvas(source.width, source.height);
  const ctx = context(canvas);
  ctx.drawImage(source, 0, 0);

  const ink = inkOf(fill);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] === 0) continue;
    const r = data[i] ?? 0;
    const g = data[i + 1] ?? 0;
    const b = data[i + 2] ?? 0;
    const high = Math.max(r, g, b);
    if (high > DARK_INK_MAX || high - Math.min(r, g, b) > INK_CHROMA_MAX) continue;
    data[i] = ink[0];
    data[i + 1] = ink[1];
    data[i + 2] = ink[2];
  }
  ctx.putImageData(image, 0, 0);
  return canvas;
}

async function load(art: LogoArt): Promise<void> {
  const response = await fetch(`${LOGO_DIR}${art.file}`);
  if (!response.ok) throw new Error(`로고 ${art.id} 를 받지 못했습니다`);
  originals.set(art.id, await createImageBitmap(await response.blob()));
}

function loadOnce(art: LogoArt): Promise<void> {
  let pending = inFlight.get(art.id);
  if (!pending) {
    pending = load(art);
    // 거부된 프라미스를 남겨 두면 한 번의 실패가 그 브랜드를 세션 내내 막습니다.
    void pending.catch(() => inFlight.delete(art.id));
    inFlight.set(art.id, pending);
  }
  return pending;
}

/**
 * 캐시에서 동기로 꺼냅니다. `paint()` 가 그리는 중에 부르는 자리라 기다릴 수 없습니다.
 * 아직 준비되지 않았으면 null 이고 그 노드는 그려지지 않습니다.
 */
export function logoImage(logoId: string, fill: string): CanvasImageSource | null {
  const art = logoArt(logoId);
  if (!art) return null;
  const original = originals.get(art.id);
  if (!original) return null;
  if (!art.darkInk) return original;
  const ready = tinted.get(art.id);
  return ready && ready.fill === fill ? ready.image : null;
}

/** 새로 채웠으면 true 입니다. 이미 캐시에 있었으면 false 입니다. */
export async function ensureLogoImage(logoId: string, fill: string): Promise<boolean> {
  const art = logoArt(logoId);
  if (!art) return false;
  if (logoImage(art.id, fill)) return false;

  if (!originals.has(art.id)) await loadOnce(art);
  const original = originals.get(art.id);
  if (!original) return false;
  if (art.darkInk) tinted.set(art.id, { fill, image: tintDarkInk(original, fill) });
  return true;
}

/**
 * 이 장면이 그리려는 로고를 모두 준비합니다. 새로 채운 것이 있으면 true 이고, 부르는
 * 쪽은 그때만 다시 그리면 됩니다. 장면의 노드에서 브랜드와 색을 함께 읽으므로 부르는
 * 쪽이 두 값을 따로 챙기지 않습니다.
 */
export async function ensureSceneLogos(scene: Scene): Promise<boolean> {
  let added = false;
  for (const node of scene.nodes) {
    if (node.kind !== 'logo') continue;
    if (await ensureLogoImage(node.logoId, node.fill)) added = true;
  }
  return added;
}
