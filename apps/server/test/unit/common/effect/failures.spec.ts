import { describe, expect, it } from 'vitest';
import {
  DbFailure,
  dbFailureFrom,
  isTransientDbFailure,
  isValidationFailure,
  validationFailure,
} from '../../../../src/common/effect/failures.ts';

describe('validationFailure', () => {
  it('builds a VALIDATION_ERROR with field details', () => {
    const failure = validationFailure([
      { path: 'limit', message: 'too large', code: 'too_big' },
    ]);

    expect(failure).toEqual({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      statusCode: 400,
      errors: [{ path: 'limit', message: 'too large', code: 'too_big' }],
    });
  });
});

describe('isValidationFailure', () => {
  it('recognises a validation failure by its errors array', () => {
    expect(isValidationFailure(validationFailure([]))).toBe(true);
  });

  it('rejects a plain domain error', () => {
    expect(isValidationFailure({ code: 'X', message: 'x', statusCode: 400 })).toBe(
      false,
    );
  });

  it('rejects non-objects', () => {
    expect(isValidationFailure(null)).toBe(false);
    expect(isValidationFailure('nope')).toBe(false);
  });
});

describe('dbFailureFrom', () => {
  it('reads a top-level pg error code', () => {
    const failure = dbFailureFrom({ code: '23505', message: 'duplicate' });

    expect(failure).toBeInstanceOf(DbFailure);
    expect(failure.sqlState).toBe('23505');
    expect(failure.detail).toBe('duplicate');
  });

  it('reads a nested cause code', () => {
    const failure = dbFailureFrom({ cause: { code: '40001' } });

    expect(failure.sqlState).toBe('40001');
  });

  it('falls back to a generic detail', () => {
    const failure = dbFailureFrom(new Error('boom'));

    expect(failure.sqlState).toBeUndefined();
    expect(failure.detail).toBe('boom');
  });
});

describe('isTransientDbFailure', () => {
  it('treats serialization and deadlock as transient', () => {
    expect(isTransientDbFailure(dbFailureFrom({ code: '40001' }))).toBe(true);
    expect(isTransientDbFailure(dbFailureFrom({ code: '40P01' }))).toBe(true);
  });

  it('treats unique violations and unknown errors as non-transient', () => {
    expect(isTransientDbFailure(dbFailureFrom({ code: '23505' }))).toBe(false);
    expect(isTransientDbFailure(dbFailureFrom(new Error('x')))).toBe(false);
  });
});
