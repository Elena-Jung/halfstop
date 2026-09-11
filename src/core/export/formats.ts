import type { ExportFormat } from './encode';

/**
 * 화면이 들고 다니는 짧은 id 입니다. MIME 문자열을 그대로 쓰면 사전 키가
 * `export.format.image/jpeg` 가 되어 버립니다. 크기 쪽(`export.size.4k`)이 이미 같은
 * 모양이고, id 에서 MIME 로 가는 길은 이 파일 하나뿐입니다.
 */
export type ExportFormatId = 'jpeg' | 'png' | 'webp';

export interface ExportFormatSpec {
  readonly mime: ExportFormat;
  /** 내려받는 파일 이름 끝에 붙습니다. 점을 포함합니다. */
  readonly extension: string;
  /**
   * 인코더에 넘길 품질입니다. png 는 무손실이라 이 값을 보지 않지만, 형식마다 if 로
   * 갈라 서지 않도록 자리를 비우지 않고 1 을 둡니다.
   */
  readonly quality: number;
}

export const EXPORT_FORMATS: Record<ExportFormatId, ExportFormatSpec> = {
  jpeg: { mime: 'image/jpeg', extension: '.jpg', quality: 0.92 },
  png: { mime: 'image/png', extension: '.png', quality: 1 },
  webp: { mime: 'image/webp', extension: '.webp', quality: 0.92 },
};

/** 화면에 보이는 차례입니다. 기본값이 맨 앞입니다. */
export const EXPORT_FORMAT_IDS: readonly ExportFormatId[] = ['jpeg', 'png', 'webp'];

export const DEFAULT_EXPORT_FORMAT: ExportFormatId = 'jpeg';
