import { Effect } from 'effect';
import type { ZodType } from 'zod';
import { formatZodIssues } from '../pipes/zod-validation.pipe.ts';
import { validationFailure, type ValidationFailure } from './failures.ts';

export function parse<T>(
  schema: ZodType<T>,
  value: unknown,
): Effect.Effect<T, ValidationFailure> {
  const result = schema.safeParse(value);
  return result.success
    ? Effect.succeed(result.data)
    : Effect.fail(validationFailure(formatZodIssues(result.error)));
}
