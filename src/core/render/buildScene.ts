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
   * 전체 해상도로 계산한 Scene과 사실상 같습니다. 축소 디코딩에서 생긴
   * 1픽셀 미만의 반올림 차이만 남고, 1500 단위에서 0.1 아래입니다.
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
