import { Effect } from 'effect';
import { describe, expect, it } from 'vitest';
import {
  BadRequestException,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { DbFailure, validationFailure } from '../../../../src/common/effect/failures.ts';
import { runGraphQL } from '../../../../src/common/effect/run.ts';
import { domainError } from '../../../../src/domain/shared/errors.ts';

describe('runGraphQL', () => {
  it('resolves a successful effect', async () => {
    await expect(runGraphQL(Effect.succeed(5))).resolves.toBe(5);
  });

  it('throws the mapped HttpException for a domain error', async () => {
    const error = await runGraphQL(
      Effect.fail(domainError('ROUTE_NOT_FOUND', 'nope', 404)),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(NotFoundException);
    expect((error as NotFoundException).getResponse()).toMatchObject({
      code: 'ROUTE_NOT_FOUND',
      message: 'nope',
    });
  });

  it('throws a BadRequestException carrying validation details', async () => {
    const error = await runGraphQL(
      Effect.fail(
        validationFailure([
          { path: 'limit', message: 'too big', code: 'too_big' },
        ]),
      ),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(BadRequestException);
    expect((error as BadRequestException).getResponse()).toMatchObject({
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      errors: [{ path: 'limit', message: 'too big', code: 'too_big' }],
    });
  });

  it('maps a DbFailure to a generic 500 without leaking detail', async () => {
    const error = await runGraphQL(
      Effect.fail(
        new DbFailure({
          sqlState: '23505',
          detail: 'duplicate key value violates unique constraint',
          cause: {},
        }),
      ),
    ).catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(InternalServerErrorException);
    expect((error as InternalServerErrorException).getResponse()).toEqual({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Database error',
    });
  });

  it('lets defects propagate unchanged', async () => {
    const error = await runGraphQL(Effect.die(new Error('boom'))).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(Error);
    expect(error).not.toBeInstanceOf(HttpException);
    expect((error as Error).message).toBe('boom');
  });
});
