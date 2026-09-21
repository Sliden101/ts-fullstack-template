# ADR 0001 — Effect-TS adoption policy for the backend

- Status: accepted
- Owner: backend
- Date: 2026-09-18
- Pinned dependency: `effect@4.0.0-rc.115` (exact)

## Context

The backend is NestJS 12 + GraphQL (Mercurius) + Drizzle/Postgres. Its shape is deliberately split:

- A pure functional core in `apps/server/src/domain/**`: synchronous, deterministic, dependency-free validators returning `Result<T, DomainError>`. No promises, DB, clock, config, or randomness.
- An imperative shell in `apps/server/src/modules/**`: Nest-injected services perform all effects (transactions, `FOR UPDATE` locks, hashing, auth, HTTP calls) and convert domain `Result` failures into thrown Nest `HttpException`.
- A stable error contract: `common/errors/to-http-exception.ts` plus `common/graphql/graphql-error-formatter.ts` produce `extensions.code` and `extensions.statusCode`, which the client localizes by code.
- Hand-rolled observability: a logging interceptor emits structured JSON; the trace id comes from Fastify.
- A single effectful dependency: one Postgres pool.

Effect v4 is currently a release candidate.

## Decision

1. Do not adopt Effect in the pure domain. `Result<T, DomainError>` is the correct minimal representation for an effect-free core.
2. Do not adopt Effect as a framework. Nest keeps DI and transport; zod keeps validation; the GraphQL error formatter and error contract stay authoritative.
3. Adopt Effect only at the effect boundary (service/module layer), and only for modules that have a real effect surface.
4. A module is converted in full or not at all; never mix the Effect and promise styles inside one module.
5. Pin the exact Effect version. Moving Effect across a layer boundary requires amending this ADR.

## Adoption scope

- In scope: any module with a real effect surface. The example `pokemon` module (outbound HTTP) is the reference implementation.
- Out of scope: `auth`, `session-revocation`, `me`, `health`, `ping`, and everything in `common/**` except the `common/effect` helper layer.
- New modules that touch the database or an external service should be authored in Effect at the service boundary.

## Conventions

- **Expected failure vs defect.** Expected, recoverable failures (invalid input, missing record, conflict, upstream failure) enter the typed error channel. Bugs and unexpected exceptions are defects and are handled once at the boundary.
- **Service failure type.** A converted service exposes `Effect.Effect<A, E, never>` where `E` is a `DomainError`. Domain validators keep returning `Result`; lift them with `fromResult`.
- **Validation.** zod remains the validator. `parse(schema, value)` returns a failed effect with a `ValidationFailure` that carries the `VALIDATION_ERROR` field details.
- **Database errors.** `tryDb` maps promise rejections to a tagged `DbFailure` carrying `sqlState`. The client never sees raw database detail.
- **HTTP errors.** `common/http/fetch-json.ts` maps upstream failures to a tagged `HttpFailure`; the service maps that to a domain error (`UPSTREAM_UNAVAILABLE`, `POKEMON_NOT_FOUND`, …).
- **Transactions.** Run effectful transaction bodies with `runInTransaction`; typed failures survive the transaction boundary and real Postgres failures become `DbFailure`.
- **Retry.** `withResilience` retries only when the operation is idempotent and the failure is transient. All writes are treated as non-idempotent. This is a correctness rule, not a tuning knob.
- **Timeout.** A timeout becomes a defect so it surfaces through the existing 500 path; no new error code is introduced.
- **Boundary adapter.** Resolvers and controllers call `runGraphQL(effect)`. Typed failures become the existing HTTP exceptions; defects propagate to `AllExceptionsFilter`.
- **DI.** Nest remains the only DI container. No parallel Effect `Layer` container.
- **Observability.** The HTTP logging interceptor and structured JSON stay. Spans are deferred.

## Consequences

Positive: one typed error vocabulary at the service boundary; retry and timeout without hand-rolled loops; transaction rollback and typed failures preserved together.

Negative: a second programming paradigm (`Effect.gen`) beside `async/await`; a large dependency; converted modules use an Effect-based test harness. The pure domain pays none of this.

## Alternatives considered

- Status quo (`Result` only) — leaves retry, timeout, and cross-cutting observability unaddressed.
- Full embrace (Effect runtime + Layers, Nest as transport) — rejected: large rewrite, duplicate DI, high churn against a stable GraphQL contract.
- Library-free targeted fixes (hand-rolled retry, OpenTelemetry) — viable, but Effect unifies them once external I/O and background work land.
