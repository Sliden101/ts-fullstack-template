# Error Contract (GraphQL + REST)

Canonical error envelope, code list, and localization guidance for the client.

The server never asks the client to display `message`. `message` is an English
fallback for logs and debugging. **Localize by `code`** (and, for field errors, by
the field's `path` + `code`).

## Transports

| Surface | Endpoint | Envelope |
| --- | --- | --- |
| GraphQL | `POST /graphql` | `errors[].extensions` |
| REST (users, self) | `/api/users`, `/api/me` | top-level `{ statusCode, code, ... }` |

Both surfaces enforce authentication: missing/invalid session → `401 UNAUTHORIZED`;
authenticated but lacking permission → `403 FORBIDDEN`.

## GraphQL envelope

HTTP status is derived from the first error. The body is a standard GraphQL response:

```json
{
  "data": null,
  "errors": [
    {
      "message": "Pokemon not found",
      "extensions": {
        "code": "POKEMON_NOT_FOUND",
        "statusCode": 404
      }
    }
  ]
}
```

When the failure has field-level detail, `extensions.errors` is present:

```json
{
  "errors": [
    {
      "message": "Validation failed",
      "extensions": {
        "code": "VALIDATION_ERROR",
        "statusCode": 400,
        "errors": [
          { "path": "name", "message": "Required", "code": "invalid_type" }
        ]
      }
    }
  ]
}
```

A malformed GraphQL document (unknown field, wrong argument shape) returns
`GRAPHQL_VALIDATION_ERROR` with the document issues in `extensions.errors`.

## REST envelope

```json
{
  "statusCode": 400,
  "code": "FIELD_NOT_EDITABLE",
  "message": "Field(s) not editable: role",
  "errors": [
    { "path": "role", "message": "Field not editable", "code": "field_not_editable" }
  ],
  "timestamp": "2026-01-01T12:00:00.000Z",
  "path": "/api/me",
  "traceId": "req-1"
}
```

`errors` is omitted when there is no field-level detail. Server errors (`5xx`) never
include a stack trace; `message` is always replaced with a generic message.

## Field errors

| Surface | Shape |
| --- | --- |
| Zod boundary (REST + GraphQL) | `{ path: "input.name", code: "too_small", message: "..." }` |
| GraphQL document validation | `{ message: "...", path?: "...", locations?: [{ line, column }] }` |

`path` uses dot notation for nested inputs. Field `code` values are Zod issue codes
(`invalid_type`, `too_small`, `too_big`, `invalid_enum_value`, `invalid_string`, …).

## Codes and suggested i18n keys

The client should map each code to a key of the form `errors.<code_in_snake>`.
The canonical list lives in `@repo/contracts` (`ERROR_CODES`).

| Code | HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Input failed the boundary schema |
| `GRAPHQL_VALIDATION_ERROR` | 400 | Malformed GraphQL document |
| `FIELD_NOT_EDITABLE` | 400 | A protected field was supplied |
| `BAD_REQUEST` | 400 | Generic bad request with no domain code |
| `UNAUTHORIZED` | 401 | Missing or invalid session |
| `SESSION_REVOKED` | 401 | The session was revoked |
| `FORBIDDEN` | 403 | Authenticated but lacking permission |
| `NOT_FOUND` | 404 | Generic missing resource |
| `USER_NOT_FOUND` | 404 | Unknown user id |
| `POKEMON_NOT_FOUND` | 404 | Unknown pokemon name (example feature) |
| `CONFLICT` | 409 | Generic conflict |
| `EMAIL_TAKEN` | 409 | Email already exists |
| `UNKNOWN_ROLE` | 400 | The supplied role is not configured |
| `NO_DATA` | 400 | An update was submitted with no fields |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_SERVER_ERROR` | 500 | Unhandled server error (details withheld) |
| `UPSTREAM_UNAVAILABLE` | 502 | An upstream service could not be reached |
| `UPSTREAM_INVALID_RESPONSE` | 502 | An upstream response did not match its schema |

### Example lookup

```ts
function messageFor(
  error: { code?: string; path?: string },
  t: (key: string) => string,
) {
  if (error.code === 'VALIDATION_ERROR' && error.path) {
    return t(`errors.validation.${error.path}`);
  }
  return error.code
    ? t(`errors.${error.code.toLowerCase()}`)
    : t('errors.unknown');
}
```

### Notes for the client

- Treat the HTTP status as a coarse bucket; switch on `code` for behavior and copy.
- `extensions.errors` is the source of truth for showing messages next to inputs.
- Do not parse `message` text; it may change.
- Writes are transactional: a rejected mutation leaves no partial state.
