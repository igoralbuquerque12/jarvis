/**
 * Securo (Pydantic v2) serializes `Decimal` fields as JSON strings ("1200.00")
 * and `float` fields as numbers. These helpers turn either into a JS number so
 * the web never does arithmetic on strings.
 */
export type SecuroNumeric = string | number;

export function toNumber(value: SecuroNumeric | null | undefined): number {
  return toOptionalNumber(value) ?? 0;
}

export function toOptionalNumber(
  value: SecuroNumeric | null | undefined,
): number | undefined {
  if (value === null || value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Securo uses `null` for absent fields; the web contract uses `undefined`. */
export function optional<T>(value: T | null | undefined): T | undefined {
  return value ?? undefined;
}
