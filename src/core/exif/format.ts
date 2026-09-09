function ok(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function formatShutter(seconds: number | undefined): string | undefined {
  if (!ok(seconds)) return undefined;
  if (seconds >= 1) return `${Number(seconds.toFixed(1))}s`;
  return `1/${Math.round(1 / seconds)}s`;
}

export function formatAperture(fNumber: number | undefined): string | undefined {
  if (!ok(fNumber)) return undefined;
  return `f/${Number(fNumber.toFixed(1))}`;
}

export function formatFocalLength(
  actual: number | undefined,
  equivalent: number | undefined,
): string | undefined {
  const a = ok(actual) ? Math.round(actual) : undefined;
  const e = ok(equivalent) ? Math.round(equivalent) : undefined;
  if (a === undefined && e === undefined) return undefined;
  if (a === undefined) return `${e}mm`;
  if (e === undefined || e === a) return `${a}mm`;
  return `${a}mm (${e}mm)`;
}

export function formatIso(iso: number | undefined): string | undefined {
  if (!ok(iso)) return undefined;
  return `ISO ${iso}`;
}

/** EXIF는 `2026:09:09 14:03:21` 형식으로 씁니다. */
export function formatTakenAt(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  const match = /^(\d{4}):(\d{2}):(\d{2})\s/.exec(raw);
  if (!match) return undefined;
  return `${match[1]}-${match[2]}-${match[3]}`;
}
