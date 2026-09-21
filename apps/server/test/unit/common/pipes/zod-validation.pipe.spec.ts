import { describe, expect, it } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { z } from 'zod';
import { ZodValidationPipe } from '../../../../src/common/pipes/zod-validation.pipe.ts';

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(1),
});

const metadata = {} as never;

describe('ZodValidationPipe', () => {
  it('returns parsed data for valid input', () => {
    const pipe = new ZodValidationPipe(schema);

    expect(
      pipe.transform({ email: 'a@b.test', name: 'Ada' }, metadata),
    ).toEqual({ email: 'a@b.test', name: 'Ada' });
  });

  it('throws a structured 400 for invalid input', () => {
    const pipe = new ZodValidationPipe(schema);

    try {
      pipe.transform({ email: 'nope', name: '' }, metadata);
      throw new Error('expected throw');
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      const response = (error as BadRequestException).getResponse() as {
        code: string;
        errors: Array<{ path: string; message: string; code: string }>;
      };
      expect(response.code).toBe('VALIDATION_ERROR');
      expect(response.errors.length).toBeGreaterThan(0);
      expect(response.errors[0]).toMatchObject({
        path: expect.any(String),
        message: expect.any(String),
        code: expect.any(String),
      });
    }
  });

  it('rejects forbidden keys with FIELD_NOT_EDITABLE', () => {
    const pipe = new ZodValidationPipe(schema, { forbiddenKeys: ['role'] });

    try {
      pipe.transform({ email: 'a@b.test', name: 'Ada', role: 'admin' }, metadata);
      throw new Error('expected throw');
    } catch (error) {
      const response = (error as BadRequestException).getResponse() as {
        code: string;
      };
      expect(response.code).toBe('FIELD_NOT_EDITABLE');
    }
  });
});
