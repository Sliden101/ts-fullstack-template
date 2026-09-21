export function extractRows<T>(result: unknown): T[] {
  return ((result as { rows?: unknown[] }).rows ?? []) as T[];
}

export function pgErrorCode(error: unknown): string | undefined {
  const candidate = error as {
    code?: unknown;
    cause?: { code?: unknown };
  };
  const code = candidate?.code ?? candidate?.cause?.code;
  return typeof code === 'string' ? code : undefined;
}

export function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === '23505';
}

// 23503 = foreign_key_violation (NO ACTION), 23001 = restrict_violation (RESTRICT).
const FOREIGN_KEY_VIOLATION_CODES = new Set(['23503', '23001']);

export function isForeignKeyViolation(error: unknown): boolean {
  const code = pgErrorCode(error);
  return code !== undefined && FOREIGN_KEY_VIOLATION_CODES.has(code);
}
