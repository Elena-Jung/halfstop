import type { TemplateToken } from '../layout/types';
import {
  formatAperture,
  formatFocalLength,
  formatIso,
  formatShutter,
  formatTakenAt,
} from './format';
import type { PhotoMeta } from './read';

/** 값이 없는 항목은 키 자체를 넣지 않습니다. 템플릿이 그 조각을 통째로 버립니다. */
export function toFields(meta: PhotoMeta): Partial<Record<TemplateToken, string>> {
  const fields: Partial<Record<TemplateToken, string>> = {};
  const put = (token: TemplateToken, value: string | undefined) => {
    if (value !== undefined) fields[token] = value;
  };

  put('MAKER', meta.make);
  put('BODY', meta.model);
  put('LENS', meta.lensModel);
  put('MM', formatFocalLength(meta.focalLength, meta.focalLengthIn35mm));
  put('F', formatAperture(meta.fNumber));
  put('SEC', formatShutter(meta.exposureTime));
  put('ISO', formatIso(meta.iso));
  put('TAKEN_AT', formatTakenAt(meta.takenAtRaw));

  return fields;
}
