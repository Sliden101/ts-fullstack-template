import { Effect } from 'effect';
import {
  BadRequestException,
  InternalServerErrorException,
  type HttpException,
} from '@nestjs/common';
import { ERROR_CODES } from '../errors/codes.ts';
import { toHttpException } from '../errors/to-http-exception.ts';
import type { DomainError } from '../../domain/shared/errors.ts';
import {
  DbFailure,
  isValidationFailure,
  type ValidationFailure,
} from './failures.ts';

export type ServiceFailure = DomainError | ValidationFailure | DbFailure;

export function toException(failure: ServiceFailure): HttpException {
  if (failure instanceof DbFailure) {
    return new InternalServerErrorException({
      code: ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: 'Database error',
    });
  }

  if (isValidationFailure(failure)) {
    return new BadRequestException({
      code: failure.code,
      message: failure.message,
      errors: failure.errors,
    });
  }

  return toHttpException(failure);
}

export function runGraphQL<A, E extends ServiceFailure>(
  effect: Effect.Effect<A, E, never>,
): Promise<A> {
  return Effect.runPromise(
    Effect.gen(function* () {
      const result = yield* Effect.result(effect);
      if (result._tag === 'Failure') {
        throw toException(result.failure);
      }
      return result.success;
    }),
  );
}
