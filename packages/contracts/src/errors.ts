import { z } from 'zod';

/**
 * Canonical, transport-agnostic error codes shared by the server and client.
 *
 * Clients must localize by `code`, never by rendering `message`.
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  GRAPHQL_VALIDATION_ERROR: 'GRAPHQL_VALIDATION_ERROR',
  FIELD_NOT_EDITABLE: 'FIELD_NOT_EDITABLE',
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  EMAIL_TAKEN: 'EMAIL_TAKEN',
  UNKNOWN_ROLE: 'UNKNOWN_ROLE',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  NO_DATA: 'NO_DATA',
  UPSTREAM_UNAVAILABLE: 'UPSTREAM_UNAVAILABLE',
  UPSTREAM_INVALID_RESPONSE: 'UPSTREAM_INVALID_RESPONSE',
  POKEMON_NOT_FOUND: 'POKEMON_NOT_FOUND',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export const fieldIssueSchema = z.object({
  path: z.string(),
  message: z.string(),
  code: z.string().optional(),
});
export type FieldIssue = z.infer<typeof fieldIssueSchema>;

/** Error envelope returned by the REST layer and attached to GraphQL errors. */
export const errorEnvelopeSchema = z.object({
  statusCode: z.number().int(),
  code: z.string(),
  message: z.string(),
  errors: z.array(fieldIssueSchema).optional(),
  timestamp: z.string().optional(),
  path: z.string().optional(),
  traceId: z.string().optional(),
});
export type ErrorEnvelope = z.infer<typeof errorEnvelopeSchema>;

/** Shape of a GraphQL error `extensions` payload. */
export const graphqlErrorExtensionsSchema = z.object({
  code: z.string().optional(),
  statusCode: z.number().int().optional(),
  errors: z.array(fieldIssueSchema).optional(),
});
export type GraphqlErrorExtensions = z.infer<typeof graphqlErrorExtensionsSchema>;
