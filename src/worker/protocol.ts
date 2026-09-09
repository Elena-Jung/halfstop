import type { ExportFormat } from '../core/export/encode';
import type { ExportPreset } from '../core/export/resolution';
import type { Scene } from '../core/layout/types';
import type { CanvasLimit } from '../core/limits/clampExportSize';

export interface RenderJob {
  id: number;
  file: Blob;
  /** 메인 스레드가 미리 계산한 레이아웃입니다. 워커는 그리기만 합니다. */
  scene: Scene;
  autoOriented: boolean;
  orientation: number;
  limit: CanvasLimit;
  preset: ExportPreset;
  format: ExportFormat;
  quality: number;
  /** 워커가 자기 FontFaceSet에 등록할 서체입니다. 주소는 워커가 직접 찾습니다. */
  fontId: string;
}

export type RenderReply =
  | { id: number; ok: true; blob: Blob; width: number; height: number; clamped: boolean }
  | { id: number; ok: false; message: string };

let counter = 0;
export function nextJobId(): number {
  counter += 1;
  return counter;
}

export function isRenderReply(value: unknown): value is RenderReply {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<RenderReply>;
  return typeof candidate.id === 'number' && typeof candidate.ok === 'boolean';
}
