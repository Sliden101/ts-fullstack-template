import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  BadRequestException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import {
  AllExceptionsFilter,
  normalizeException,
  statusToCode,
} from '../../../../src/common/filters/all-exceptions.filter.ts';

beforeEach(() => {
  vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
});

describe('statusToCode', () => {
  it('maps known HTTP statuses', () => {
    expect(statusToCode(400)).toBe('BAD_REQUEST');
    expect(statusToCode(401)).toBe('UNAUTHORIZED');
    expect(statusToCode(403)).toBe('FORBIDDEN');
    expect(statusToCode(404)).toBe('NOT_FOUND');
    expect(statusToCode(409)).toBe('CONFLICT');
  });

  it('falls back to ERROR', () => {
    expect(statusToCode(418)).toBe('ERROR');
  });
});

describe('normalizeException', () => {
  it('normalizes string HttpExceptions', () => {
    expect(normalizeException(new UnauthorizedException('nope'))).toMatchObject({
      statusCode: 401,
      message: 'nope',
    });
  });

  it('normalizes object HttpExceptions with array messages', () => {
    const exception = new BadRequestException({
      message: ['a', 'b'],
      code: 'VALIDATION_ERROR',
    });

    expect(normalizeException(exception)).toEqual({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'a; b',
    });
  });

  it('normalizes a code-less HttpException', () => {
    expect(normalizeException(new NotFoundException('gone'))).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'gone',
    });
  });

  it('normalizes a Better Auth style error with statusCode and body', () => {
    expect(
      normalizeException({
        statusCode: 401,
        body: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid' },
      }),
    ).toEqual({
      statusCode: 401,
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Invalid',
    });
  });

  it('falls back to 500 for unknown errors', () => {
    expect(normalizeException(new Error('kaboom'))).toEqual({
      statusCode: 500,
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
    });
  });

  it('maps PostgreSQL unique violations to 409', () => {
    expect(normalizeException({ code: '23505' })).toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('maps PostgreSQL foreign key violations to 409', () => {
    expect(normalizeException({ cause: { code: '23503' } })).toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('passes through structured validation errors', () => {
    const normalized = normalizeException(
      new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        errors: [{ path: 'email', message: 'Invalid', code: 'invalid_string' }],
      }),
    );

    expect(normalized).toMatchObject({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      errors: [{ path: 'email' }],
    });
  });
});

describe('AllExceptionsFilter', () => {
  function createHost(type: string) {
    const reply = {
      status: vi.fn().mockReturnThis(),
      send: vi.fn().mockReturnThis(),
    };
    const request = { method: 'POST', url: '/api/thing', id: 'trace-1' };
    const host = {
      getType: () => type,
      switchToHttp: () => ({
        getResponse: () => reply,
        getRequest: () => request,
      }),
    } as unknown as ArgumentsHost;

    return { host, reply };
  }

  it('writes a structured error response for HTTP contexts', () => {
    const { host, reply } = createHost('http');

    new AllExceptionsFilter().catch(new BadRequestException('bad'), host);

    expect(reply.status).toHaveBeenCalledWith(400);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        message: 'bad',
        path: '/api/thing',
      }),
    );
  });

  it('hides internal error details for 5xx responses', () => {
    const { host, reply } = createHost('http');

    new AllExceptionsFilter().catch(new Error('secret stack'), host);

    expect(reply.status).toHaveBeenCalledWith(500);
    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      }),
    );
  });

  it('rethrows GraphQL exceptions so GraphQL can handle them', () => {
    const { host } = createHost('graphql');

    expect(() =>
      new AllExceptionsFilter().catch(new Error('graphql'), host),
    ).toThrow('graphql');
  });

  it('includes the trace id in the error envelope', () => {
    const { host, reply } = createHost('http');

    new AllExceptionsFilter().catch(new BadRequestException('bad'), host);

    expect(reply.send).toHaveBeenCalledWith(
      expect.objectContaining({ traceId: 'trace-1' }),
    );
  });

  it('logs auth.failure for 401 and 403 responses', () => {
    const errorSpy = vi.spyOn(Logger.prototype, 'error');
    const { host } = createHost('http');

    new AllExceptionsFilter().catch(
      new UnauthorizedException('nope'),
      host,
    );

    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('auth.failure'),
    );
  });
});
