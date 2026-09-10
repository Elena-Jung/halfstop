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

export function buildScene(request: SceneRequest): Scene {
  const photo = toUnits(request.photoPx.width, request.photoPx.height);
  return request.layout(
    { photo, fields: request.fields, logoId: request.logoId, options: request.options },
    request.services,
  );
}
