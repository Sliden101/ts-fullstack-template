import { Logger } from '@nestjs/common';
import type { ExecutionResult, GraphQLError } from 'graphql';
import { ERROR_CODES } from '../errors/codes.ts';

export interface FormattedGraphQLResponse {
  statusCode: number;
  response: ExecutionResult;
}

const logger = new Logger('GraphQLError');

const GRAPHQL_VALIDATION_CODE = 'MER_ERR_GQL_VALIDATION';

const CODE_STATUS: Record<string, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  INVALID_EMAIL_OR_PASSWORD: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
};

const AUTH_FAILURE_STATUSES = new Set([401, 403]);

type ErrorWithOrigin = GraphQLError & {
  originalError?: {
    statusCode?: unknown;
    status?: unknown;
    code?: unknown;
    errors?: unknown;
    getResponse?: () => unknown;
  } | null;
};

function codeFromStatus(statusCode: number): string {
  for (const [code, status] of Object.entries(CODE_STATUS)) {
    if (status === statusCode) {
      return code;
    }
  }
  return 'ERROR';
}

export function statusFromGraphQLError(error: ErrorWithOrigin): number | undefined {
  const original = error.originalError;
  const fromOriginal = original?.statusCode ?? original?.status;
  if (typeof fromOriginal === 'number' && fromOriginal >= 400) {
    return fromOriginal;
  }

  const extensions = (error.extensions ?? {}) as Record<string, unknown>;
  const http = extensions.http as { status?: unknown } | undefined;
  const fromExtensions = extensions.statusCode ?? extensions.status ?? http?.status;
  if (typeof fromExtensions === 'number' && fromExtensions >= 400) {
    return fromExtensions;
  }

  const code = extensions.code;
  if (typeof code === 'string' && CODE_STATUS[code]) {
    return CODE_STATUS[code];
  }

  return undefined;
}

export function resolveStatusCode(
  errors: ReadonlyArray<ErrorWithOrigin> | undefined,
): number {
  for (const error of errors ?? []) {
    const status = statusFromGraphQLError(error);
    if (status) {
      return status;
    }
  }
  return 200;
}

function errorCode(
  errors: ReadonlyArray<ErrorWithOrigin> | undefined,
): string | undefined {
  for (const error of errors ?? []) {
    const code = (error.extensions as Record<string, unknown> | undefined)?.code;
    if (typeof code === 'string' && code.length > 0) {
      return code;
    }
  }
  return undefined;
}

function codeFromOriginalError(error: ErrorWithOrigin): string | undefined {
  const original = error.originalError;
  if (!original || typeof original.getResponse !== 'function') {
    return undefined;
  }
  const body = original.getResponse();
  if (body && typeof body === 'object') {
    const code = (body as Record<string, unknown>).code;
    if (typeof code === 'string' && code.length > 0) {
      return code;
    }
  }
  return undefined;
}

export function isGraphqlValidationError(error: ErrorWithOrigin): boolean {
  return error.originalError?.code === GRAPHQL_VALIDATION_CODE;
}

function originalErrorDetails(error: ErrorWithOrigin): unknown[] | undefined {
  const original = error.originalError;
  if (!original) {
    return undefined;
  }

  if (typeof original.getResponse === 'function') {
    const body = original.getResponse();
    if (
      body &&
      typeof body === 'object' &&
      Array.isArray((body as Record<string, unknown>).errors)
    ) {
      return (body as Record<string, unknown>).errors as unknown[];
    }
  }

  if (Array.isArray(original.errors)) {
    return original.errors.map((entry) => {
      const item = entry as {
        message?: unknown;
        path?: unknown;
        locations?: unknown;
      };
      return {
        message:
          typeof item?.message === 'string' ? item.message : 'Invalid request',
        ...(Array.isArray(item?.path) ? { path: item.path.join('.') } : {}),
        ...(Array.isArray(item?.locations) ? { locations: item.locations } : {}),
      };
    });
  }

  return undefined;
}

function deriveErrorCode(
  error: ErrorWithOrigin,
  statusCode: number | undefined,
): string | undefined {
  if (isGraphqlValidationError(error)) {
    return ERROR_CODES.GRAPHQL_VALIDATION_ERROR;
  }
  const fromExtensions = errorCode([error]);
  if (fromExtensions) {
    return fromExtensions;
  }
  const fromOriginal = codeFromOriginalError(error);
  if (fromOriginal) {
    return fromOriginal;
  }
  return statusCode ? codeFromStatus(statusCode) : undefined;
}

function attachErrorContracts(
  errors: ReadonlyArray<ErrorWithOrigin> | undefined,
): void {
  for (const error of errors ?? []) {
    const statusCode = statusFromGraphQLError(error);
    const code = deriveErrorCode(error, statusCode);
    const details = originalErrorDetails(error);
    if (!code && !statusCode && !details) {
      continue;
    }
    const extensions = { ...(error.extensions ?? {}) } as Record<string, unknown>;
    if (code) {
      extensions.code = code;
    }
    if (statusCode) {
      extensions.statusCode = statusCode;
    }
    if (details && details.length > 0) {
      extensions.errors = details;
    }
    (error as { extensions: GraphQLError['extensions'] }).extensions =
      extensions as GraphQLError['extensions'];
  }
}

export function graphqlErrorFormatter(
  execution: ExecutionResult & { errors?: ReadonlyArray<GraphQLError> },
  context?: unknown,
): FormattedGraphQLResponse {
  const errors = execution.errors as ErrorWithOrigin[] | undefined;
  attachErrorContracts(errors);
  const statusCode = resolveStatusCode(errors);

  if (AUTH_FAILURE_STATUSES.has(statusCode)) {
    const traceId = (context as { req?: { id?: string } } | undefined)?.req?.id;
    logger.error(
      JSON.stringify({
        event: 'auth.failure',
        source: 'graphql',
        statusCode,
        code: errorCode(errors) ?? codeFromStatus(statusCode),
        traceId,
      }),
    );
  }

  return { statusCode, response: execution };
}
