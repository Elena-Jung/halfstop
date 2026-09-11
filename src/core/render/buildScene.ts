import type {
  LayoutServices,
  OptionValue,
  PresetLayout,
  Scene,
  TemplateToken,
} from '../layout/types';
import { toUnits } from '../layout/units';

export interface SceneRequest {
  /**
   * 미리보기 비트맵 크기를 넘겨도 됩니다. 디자인 단위는 비율만 보므로
   * 전체 해상도로 계산한 Scene과 사실상 같습니다. 축소 디코딩에서 브라우저가
   * 짧은 변을 정수로 반올림하면서 생기는 오차만 남습니다. 3:2 사진에서는
   * 항상 약 0.47 단위이고, 3:2에 가깝지만 정확히는 아닌 실제 카메라 해상도
   * 중에는 최대 약 0.7 단위까지 벌어지는 경우가 있습니다.
   */
  photoPx: { width: number; height: number };
  fields: Partial<Record<TemplateToken, string>>;
  logoId: string | undefined;
  layout: PresetLayout;
  options: ReadonlyMap<string, OptionValue>;
  services: LayoutServices;
}

/**
 * AUTHOR 는 EXIF 가 아니라 AUTHOR 옵션에서 옵니다. 사용자가 직접 치는 값 하나만 두어
 * 값이 두 곳(EXIF의 Artist, 이 옵션)으로 갈라지지 않게 합니다.
 *
 * 빈 문자열은 fields 에 넣지 않습니다. 값이 없는 토큰은 템플릿에서 통째로 사라지는
 * 것이 이 저장소의 규칙이고, 이 자리에서 그 규칙을 어기면 다른 곳에서도 값이 있는
 * 토큰과 없는 토큰을 구분할 때 빈 문자열을 값으로 잘못 셀 수 있습니다.
 */
function withAuthor(
  fields: Partial<Record<TemplateToken, string>>,
  options: ReadonlyMap<string, OptionValue>,
): Partial<Record<TemplateToken, string>> {
  const author = options.get('AUTHOR');
  if (typeof author !== 'string' || author === '') return fields;
  return { ...fields, AUTHOR: author };
}

export function buildScene(request: SceneRequest): Scene {
  const photo = toUnits(request.photoPx.width, request.photoPx.height);
  return request.layout(
    {
      photo,
      fields: withAuthor(request.fields, request.options),
      logoId: request.logoId,
      options: request.options,
    },
    request.services,
  );
}
