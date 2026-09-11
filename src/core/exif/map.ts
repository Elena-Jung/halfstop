import type { TemplateToken } from '../layout/types';
import {
  formatAperture,
  formatFocalLength,
  formatIso,
  formatShutter,
  formatTakenAt,
} from './format';
import { bodyLabel, brandLabel } from '../logos/brandId';
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
  put('BODY', bodyLabel(meta.model, meta.make));
  put('LENS', meta.lensModel);
  put('LENS_MAKER', resolveLensMaker(meta.lensModel, meta.lensMake));
  put('MM', formatFocalLength(meta.focalLength, meta.focalLengthIn35mm));
  put('F', formatAperture(meta.fNumber));
  put('SEC', formatShutter(meta.exposureTime));
  put('ISO', formatIso(meta.iso));
  put('TAKEN_AT', formatTakenAt(meta.takenAtRaw));

  return fields;
}
