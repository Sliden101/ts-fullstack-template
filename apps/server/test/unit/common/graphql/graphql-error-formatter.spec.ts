import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import {
  graphqlErrorFormatter,
  resolveStatusCode,
  statusFromGraphQLError,
} from '../../../../src/common/graphql/graphql-error-formatter.ts';

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  errorSpy = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

function errorWith(extensions?: Record<string, unknown>): GraphQLError {
  return new GraphQLError('boom', { extensions });
}

describe('statusFromGraphQLError', () => {
  it('reads statusCode from the original error', () => {
    const error = new GraphQLError('unauthorized', {
      originalError: Object.assign(new Error('unauthorized'), {
        statusCode: 401,
      }),
    });

    expect(statusFromGraphQLError(error)).toBe(401);
  });

  it('reads the numeric status extension', () => {
    expect(statusFromGraphQLError(errorWith({ statusCode: 409 }))).toBe(409);
  });

  it('reads the http.status extension', () => {
    expect(statusFromGraphQLError(errorWith({ http: { status: 403 } }))).toBe(
      403,
    );
  });

  it('maps known error codes', () => {
    expect(statusFromGraphQLError(errorWith({ code: 'UNAUTHORIZED' }))).toBe(
      401,
    );
    expect(
      statusFromGraphQLError(errorWith({ code: 'INVALID_EMAIL_OR_PASSWORD' })),
    ).toBe(401);
    expect(statusFromGraphQLError(errorWith({ code: 'CONFLICT' }))).toBe(409);
  });

  it('returns undefined for unknown errors', () => {
    expect(statusFromGraphQLError(errorWith({ code: 'SOMETHING' }))).toBeUndefined();
    expect(statusFromGraphQLError(errorWith())).toBeUndefined();
  });
});

describe('resolveStatusCode', () => {
  it('defaults to 200 with no errors', () => {
    expect(resolveStatusCode([])).toBe(200);
    expect(resolveStatusCode(undefined)).toBe(200);
  });

  it('uses the first mapped status', () => {
    expect(
      resolveStatusCode([
        errorWith({ code: 'SOMETHING' }),
        errorWith({ code: 'FORBIDDEN' }),
      ]),
    ).toBe(403);
  });
});

describe('graphqlErrorFormatter', () => {
  it('returns the execution result with a derived status code', () => {
    const execution = {
      data: null,
      errors: [errorWith({ code: 'UNAUTHORIZED' })],
    };

    const formatted = graphqlErrorFormatter(execution);

    expect(formatted.statusCode).toBe(401);
    expect(formatted.response).toBe(execution);
  });

  it('returns 200 for successful executions', () => {
    const formatted = graphqlErrorFormatter({ data: { me: null } });
    expect(formatted.statusCode).toBe(200);
  });

  it('logs exactly one auth.failure for 401 with traceId', () => {
    const execution = {
      data: null,
      errors: [errorWith({ code: 'UNAUTHORIZED' })],
    };

    graphqlErrorFormatter(execution, { req: { id: 'trace-9' } });

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      event: 'auth.failure',
      source: 'graphql',
      statusCode: 401,
      code: 'UNAUTHORIZED',
      traceId: 'trace-9',
    });
  });

  it('logs exactly one auth.failure for 403', () => {
    const execution = {
      data: null,
      errors: [errorWith({ code: 'FORBIDDEN' })],
    };

    graphqlErrorFormatter(execution);

    expect(errorSpy).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload).toMatchObject({
      event: 'auth.failure',
      source: 'graphql',
      statusCode: 403,
    });
  });

  it('does not log for 200, 400 or 500', () => {
    graphqlErrorFormatter({ data: { me: null } });
    graphqlErrorFormatter({ data: null, errors: [errorWith({ code: 'BAD_REQUEST' })] });
    graphqlErrorFormatter({
      data: null,
      errors: [errorWith({ code: 'INTERNAL_SERVER_ERROR' })],
    });

    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('falls back to the status-derived code when extensions have none', () => {
    graphqlErrorFormatter({
      data: null,
      errors: [
        new GraphQLError('forbidden', {
          originalError: Object.assign(new Error('forbidden'), { statusCode: 403 }),
        }),
      ],
    });

    const payload = JSON.parse(errorSpy.mock.calls[0][0] as string);
    expect(payload.code).toBe('FORBIDDEN');
  });
});

describe('graphqlErrorFormatter error contracts', () => {
  it('promotes the HttpException body code into extensions.code', () => {
    const error = new GraphQLError('Route not found', {
      originalError: new NotFoundException({
        code: 'ROUTE_NOT_FOUND',
        message: 'Route not found',
      }),
    });

    graphqlErrorFormatter({ data: null, errors: [error] });

    expect(error.extensions.code).toBe('ROUTE_NOT_FOUND');
    expect(error.extensions.statusCode).toBe(404);
  });

  it('preserves an existing extensions.code and adds statusCode', () => {
    const error = new GraphQLError('Route code already exists', {
      extensions: { code: 'ROUTE_CODE_TAKEN' },
      originalError: new ConflictException({
        code: 'ROUTE_CODE_TAKEN',
        message: 'Route code already exists',
      }),
    });

    graphqlErrorFormatter({ data: null, errors: [error] });

    expect(error.extensions.code).toBe('ROUTE_CODE_TAKEN');
    expect(error.extensions.statusCode).toBe(409);
  });

  it('falls back to the status-derived code when the body has none', () => {
    const error = new GraphQLError('forbidden', {
      originalError: Object.assign(new Error('forbidden'), { statusCode: 403 }),
    });

    graphqlErrorFormatter({ data: null, errors: [error] });

    expect(error.extensions.code).toBe('FORBIDDEN');
    expect(error.extensions.statusCode).toBe(403);
  });

  it('leaves errors without a code or status untouched', () => {
    const error = new GraphQLError('syntax error');

    graphqlErrorFormatter({ data: null, errors: [error] });

    expect(error.extensions.code).toBeUndefined();
    expect(error.extensions.statusCode).toBeUndefined();
  });

  it('exposes Zod field details as extensions.errors', () => {
    const error = new GraphQLError('Validation failed', {
      originalError: new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: [
          { path: 'limit', message: 'Too big', code: 'too_big' },
        ],
      }),
    });

    graphqlErrorFormatter({ data: null, errors: [error] });

    expect(error.extensions.code).toBe('VALIDATION_ERROR');
    expect(error.extensions.errors).toEqual([
      { path: 'limit', message: 'Too big', code: 'too_big' },
    ]);
  });

  it('maps GraphQL document validation failures to a stable code and details', () => {
    const validationError = new GraphQLError(
      'Cannot query field "nope" on type "Customer".',
    );
    const error = new GraphQLError('Graphql validation error', {
      originalError: Object.assign(new Error('Graphql validation error'), {
        code: 'MER_ERR_GQL_VALIDATION',
        statusCode: 400,
        errors: [validationError],
      }),
    });

    graphqlErrorFormatter({ data: null, errors: [error] });

    expect(error.extensions.code).toBe('GRAPHQL_VALIDATION_ERROR');
    expect(error.extensions.statusCode).toBe(400);
    expect(error.extensions.errors).toEqual([
      {
        message: 'Cannot query field "nope" on type "Customer".',
      },
    ]);
  });
});
