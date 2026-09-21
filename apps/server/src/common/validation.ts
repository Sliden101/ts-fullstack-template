import { BadRequestException } from '@nestjs/common';
import { ERROR_CODES } from './errors/codes.ts';
import type { ZodType } from 'zod';
import { formatZodIssues } from './pipes/zod-validation.pipe.ts';

export function validateOrThrow<T>(schema: ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw new BadRequestException({
      code: ERROR_CODES.VALIDATION_ERROR,
      message: 'Validation failed',
      errors: formatZodIssues(result.error),
    });
  }

  return result.data;
}
