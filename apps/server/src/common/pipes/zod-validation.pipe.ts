import { BadRequestException } from '@nestjs/common';
import { ERROR_CODES } from '../errors/codes.ts';
import type { ArgumentMetadata, PipeTransform } from '@nestjs/common';
import type { ZodError, ZodType } from 'zod';

export interface ValidationErrorDetail {
  path: string;
  message: string;
  code: string;
}

export interface ZodValidationOptions {
  forbiddenKeys?: string[];
}

export function formatZodIssues(error: ZodError): ValidationErrorDetail[] {
  return error.issues.map((issue) => ({
    path: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
}

export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(
    private readonly schema: ZodType<T>,
    private readonly options: ZodValidationOptions = {},
  ) {}

  transform(value: unknown, _metadata: ArgumentMetadata): T {
    const forbiddenKeys = this.options.forbiddenKeys ?? [];

    if (
      forbiddenKeys.length > 0 &&
      value !== null &&
      typeof value === 'object' &&
      !Array.isArray(value)
    ) {
      const present = forbiddenKeys.filter((key) =>
        Object.prototype.hasOwnProperty.call(value, key),
      );
      if (present.length > 0) {
        throw new BadRequestException({
          code: ERROR_CODES.FIELD_NOT_EDITABLE,
          message: `Field(s) not editable: ${present.join(', ')}`,
          errors: present.map((key) => ({
            path: key,
            message: 'Field not editable',
            code: 'field_not_editable',
          })),
        });
      }
    }

    const result = this.schema.safeParse(value);

    if (!result.success) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Validation failed',
        errors: formatZodIssues(result.error),
      });
    }

    return result.data;
  }
}
