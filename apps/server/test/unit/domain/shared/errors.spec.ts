import { describe, expect, it } from 'vitest';
import { domainError } from '../../../../src/domain/shared/errors.ts';

describe('domainError', () => {
  it('builds a plain domain error', () => {
    expect(domainError('X', 'boom', 400)).toEqual({
      code: 'X',
      message: 'boom',
      statusCode: 400,
    });
  });
});
