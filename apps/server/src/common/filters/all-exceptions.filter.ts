import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import type { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import type { FastifyReply, FastifyRequest } from 'fastify';

export interface NormalizedError {
  statusCode: number;
  code: string;
  message: string;
  errors?: unknown[];
}

const HTTP_CODE_NAMES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'BAD_REQUEST',
  [HttpStatus.UNAUTHORIZED]: 'UNAUTHORIZED',
  [HttpStatus.FORBIDDEN]: 'FORBIDDEN',
  [HttpStatus.NOT_FOUND]: 'NOT_FOUND',
  [HttpStatus.CONFLICT]: 'CONFLICT',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'UNPROCESSABLE_ENTITY',
  [HttpStatus.TOO_MANY_REQUESTS]: 'TOO_MANY_REQUESTS',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'INTERNAL_SERVER_ERROR',
};

// 23505 = unique_violation, 23503 = foreign_key_violation, 23001 = restrict_violation.
const PG_CONFLICT_CODES = new Set(['23505', '23503', '23001']);

export function statusToCode(statusCode: number): string {
  return HTTP_CODE_NAMES[statusCode] ?? 'ERROR';
}

export function normalizeException(exception: unknown): NormalizedError {
  if (exception instanceof HttpException) {
    const statusCode = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === 'string') {
      return { statusCode, code: statusToCode(statusCode), message: response };
    }

    const body = response as {
      message?: string | string[];
      code?: string;
      errors?: unknown[];
    };
    const message = Array.isArray(body.message)
      ? body.message.join('; ')
      : body.message ?? exception.message;

    return {
      statusCode,
      code: body.code ?? statusToCode(statusCode),
      message,
      ...(Array.isArray(body.errors) ? { errors: body.errors } : {}),
    };
  }

  const candidate = exception as {
    statusCode?: unknown;
    code?: unknown;
    message?: string;
    body?: { code?: string; message?: string };
    cause?: { code?: unknown };
  };

  const pgCode =
    typeof candidate.code === 'string'
      ? candidate.code
      : typeof candidate.cause?.code === 'string'
        ? candidate.cause.code
        : undefined;

  if (pgCode && PG_CONFLICT_CODES.has(pgCode)) {
    return {
      statusCode: HttpStatus.CONFLICT,
      code: 'CONFLICT',
      message: 'Resource conflict',
    };
  }

  if (typeof candidate.statusCode === 'number' && candidate.statusCode >= 400) {
    return {
      statusCode: candidate.statusCode,
      code: candidate.body?.code ?? statusToCode(candidate.statusCode),
      message: candidate.body?.message ?? candidate.message ?? 'Error',
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Internal server error',
  };
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() !== 'http') {
      throw exception;
    }

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    const normalized = normalizeException(exception);
    const isServerError = normalized.statusCode >= 500;
    const isAuthError =
      normalized.statusCode === HttpStatus.UNAUTHORIZED ||
      normalized.statusCode === HttpStatus.FORBIDDEN;
    const traceId =
      (request as { id?: string } | undefined)?.id ??
      request?.headers?.['x-request-id'];
    const userId = (request as { user?: { id?: string } } | undefined)?.user?.id;

    this.logger.error(
      JSON.stringify({
        event: isAuthError ? 'auth.failure' : 'http.error',
        traceId,
        userId,
        method: request?.method,
        path: request?.url,
        statusCode: normalized.statusCode,
        code: normalized.code,
        message: normalized.message,
      }),
    );

    void response.status(normalized.statusCode).send({
      statusCode: normalized.statusCode,
      code: normalized.code,
      message: isServerError ? 'Internal server error' : normalized.message,
      ...(normalized.errors ? { errors: normalized.errors } : {}),
      timestamp: new Date().toISOString(),
      path: request?.url,
      traceId,
    });
  }
}
