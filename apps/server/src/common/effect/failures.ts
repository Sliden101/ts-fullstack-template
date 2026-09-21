import { Data } from 'effect';
import { ERROR_CODES } from '../errors/codes.ts';
import type { DomainError } from '../../domain/shared/errors.ts';
import type { ValidationErrorDetail } from '../pipes/zod-validation.pipe.ts';

export interface ValidationFailure extends DomainError {
  readonly errors: readonly ValidationErrorDetail[];
}

export function validationFailure(
  issues: readonly ValidationErrorDetail[],
): ValidationFailure {
  return {
    code: ERROR_CODES.VALIDATION_ERROR,
    message: 'Validation failed',
    statusCode: 400,
    errors: issues,
  };
}

export function isValidationFailure(
  error: unknown,
): error is ValidationFailure {
  return (
    typeof error === 'object' &&
    error !== null &&
    Array.isArray((error as { errors?: unknown }).errors)
  );
}

export class DbFailure extends Data.TaggedError('DbFailure')<{
  readonly sqlState: string | undefined;
  readonly detail: string;
  readonly cause: unknown;
}> {}

const TRANSIENT_SQL_STATES = new Set(['40001', '40P01']);

export function isTransientDbFailure(failure: DbFailure): boolean {
  return (
    failure.sqlState !== undefined && TRANSIENT_SQL_STATES.has(failure.sqlState)
  );
}

export function dbFailureFrom(error: unknown): DbFailure {
  const candidate = error as {
    code?: unknown;
    message?: unknown;
    cause?: { code?: unknown };
  };
  const rawSqlState = candidate?.code ?? candidate?.cause?.code;
  const sqlState = typeof rawSqlState === 'string' ? rawSqlState : undefined;
  const detail =
    typeof candidate?.message === 'string'
      ? candidate.message
      : 'Database error';
  return new DbFailure({ sqlState, detail, cause: error });
}
