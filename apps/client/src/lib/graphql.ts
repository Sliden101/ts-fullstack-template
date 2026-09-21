import type { GraphqlErrorExtensions } from '@repo/contracts';

export interface GraphQLError {
  message: string;
  extensions?: GraphqlErrorExtensions;
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}

/**
 * A failed GraphQL request. Carries the server error `code` so callers can
 * localize by code instead of rendering `message`.
 */
export class GraphQLRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = 'GraphQLRequestError';
  }
}

export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

const AUTH_FAILURE_CODES = new Set(['UNAUTHORIZED', 'SESSION_REVOKED']);

/** Base URL for API calls. Empty in development so the Vite proxy is used. */
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

function endpoint(): string {
  return `${API_BASE}/graphql`;
}

function isAuthFailure(error: GraphQLError): boolean {
  return (
    error.extensions?.statusCode === 401 ||
    (error.extensions?.code !== undefined &&
      AUTH_FAILURE_CODES.has(error.extensions.code))
  );
}

export async function graphqlRequest<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch(endpoint(), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ query, variables }),
  });

  const body = (await response.json()) as GraphQLResponse<T>;

  if (body.errors?.length) {
    const first = body.errors[0];
    if (body.errors.some(isAuthFailure)) {
      window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
    }
    throw new GraphQLRequestError(
      first?.message ?? 'GraphQL request failed',
      first?.extensions?.code,
      first?.extensions?.statusCode,
    );
  }
  if (!response.ok || !body.data) {
    throw new GraphQLRequestError(`GraphQL request failed (${response.status})`);
  }

  return body.data;
}
