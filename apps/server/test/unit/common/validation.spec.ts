import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { validateOrThrow } from '../../../src/common/validation.ts';

const Schema = z.object({ name: z.string().min(2) });

describe('validateOrThrow', () => {
  it('returns parsed data on success', () => {
    expect(validateOrThrow(Schema, { name: 'Ada' })).toEqual({ name: 'Ada' });
  });

  it('throws a 400 VALIDATION_ERROR with issues on failure', () => {
    let caught: unknown;
    try {
      validateOrThrow(Schema, { name: 'A' });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(BadRequestException);
    expect((caught as BadRequestException).getResponse()).toMatchObject({
      code: 'VALIDATION_ERROR',
      errors: [{ path: 'name' }],
    });
  });
});
