import type { TemplateToken } from '../layout/types';
import {
  formatAperture,
  formatFocalLength,
  formatIso,
  formatShutter,
  formatTakenAt,
} from './format';
import { bodyLabel, brandLabel } from '../logos/brandId';
import { bodyName } from './bodyName';
import { resolveLensMaker } from './lensMaker';
import type { PhotoMeta } from './read';

/** 값이 없는 항목은 키 자체를 넣지 않습니다. 템플릿이 그 조각을 통째로 버립니다. */
export function toFields(meta: PhotoMeta): Partial<Record<TemplateToken, string>> {
  const fields: Partial<Record<TemplateToken, string>> = {};
  const put = (token: TemplateToken, value: string | undefined) => {
    if (value !== undefined) fields[token] = value;
  };

  // EXIF 의 Make 는 법인명이라 길어서 그대로 그리면 잘립니다. 법인격 꼬리를 뗍니다.
  put('MAKER', brandLabel(meta.make));
  // 니콘, 캐논, 라이카처럼 Model 앞에 제조사 이름이 겹쳐 붙는 바디가 있습니다. 겹치는
  // 앞머리만 뗍니다. `NIKON · NIKON D750` 처럼 브랜드가 두 번 나오던 결함입니다.
  // bodyLabel을 bodyName보다 먼저 적용합니다. bodyLabel이 떼는 것은 제조사 전체
  // 이름이고 bodyName이 바꾸는 것은 소니의 내부 코드명 접두사(ILCE-/ILCA-)뿐이라
  // 지금은 두 규칙이 같은 자리에서 부딪히지 않지만, 제조사 중복을 먼저 없앤
  // 문자열 위에서 코드명 규칙이 동작해야 이후 다른 브랜드의 코드명 규칙이 늘어나도
  // 제조사 접두사가 남아 있는지를 매번 신경 쓰지 않아도 됩니다.
  put('BODY', bodyName(bodyLabel(meta.model, meta.make)));
  put('LENS', meta.lensModel);
  put('LENS_MAKER', resolveLensMaker(meta.lensModel, meta.lensMake));
  put('MM', formatFocalLength(meta.focalLength, meta.focalLengthIn35mm));
  put('F', formatAperture(meta.fNumber));
  put('SEC', formatShutter(meta.exposureTime));
  put('ISO', formatIso(meta.iso));
  put('TAKEN_AT', formatTakenAt(meta.takenAtRaw));

  return fields;
}
