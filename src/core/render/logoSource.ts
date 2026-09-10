import { fitLogoBox, logoParts } from '../logos/registry';
import type { LogoPiece } from '../paint/paint';

/**
 * 로고 조각들을 `Path2D` 로 만들어 0..1 정사각형에 가로세로 비를 지키며 가운데 정렬로
 * 맞춥니다. `paint()` 는 이 정사각형을 노드의 w/h 로 다시 늘려 그리므로(`scale(w, h)`),
 * 여기서 미리 맞춰 두어야 늘어난 결과도 로고 자체의 비율이 흐트러지지 않습니다.
 *
 * 조각의 `transform` 은 원본 SVG 가 viewBox 좌표계 안에서 걸어 둔 변환이라 정규화 행렬의
 * 오른쪽에 곱합니다. 조각의 좌표에 자기 변환이 먼저 걸리고 그 결과에 정규화가 걸려야
 * 합니다. 순서를 뒤집으면 정규화의 평행이동이 조각 변환에 다시 휘둘려 로고가 제자리를
 * 벗어납니다. 배율만 보면 순서를 바꿔도 같아 보이므로 평행이동이 있는 로고에서만
 * 드러납니다.
 *
 * **미리보기(메인 스레드)와 내보내기(워커)가 이 함수 하나를 함께 씁니다.** 한때 두 파일에
 * 똑같은 함수가 따로 있었고, 주석으로 "한쪽을 고치면 다른 쪽도 고치라" 고 적어 두었습니다.
 * 사람이 지켜야 하는 규칙은 언젠가 깨지고, 깨지면 미리보기에는 로고가 보이는데 받은
 * 파일에는 없는 이 앱에서 가장 비싼 버그가 됩니다. 그래서 한 자리로 합쳤습니다.
 *
 * `Path2D` 와 `DOMMatrix` 는 창과 워커 양쪽에 있으므로 이 파일은 두 곳에서 모두 돌아갑니다.
 * 같은 이유로 `paintToCanvas.ts` 도 여기에 있습니다. 다만 이 둘은 테스트 환경(`node`)에는
 * 없는 API 라 이 파일은 단위 테스트가 붙지 않습니다. 검사할 값이 있는 계산은
 * `fitLogoBox` 로 빼 두었고 그쪽에 테스트가 있습니다.
 */
export function logoSource(logoId: string): readonly LogoPiece[] | null {
  const entry = logoParts(logoId);
  if (!entry) return null;
  const fit = fitLogoBox(entry.viewBox, { width: 1, height: 1 });
  const scale = fit.width / entry.viewBox.width;
  const outer = new DOMMatrix().translate(fit.x, fit.y).scale(scale);
  return entry.parts.map((part) => {
    const normalized = new Path2D();
    normalized.addPath(
      new Path2D(part.d),
      part.transform ? outer.multiply(new DOMMatrix([...part.transform])) : outer,
    );
    return { path: normalized, fillRule: part.fillRule ?? 'nonzero' };
  });
}
