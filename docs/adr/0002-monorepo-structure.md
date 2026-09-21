# ADR 0002 — npm-workspaces monorepo structure

- Status: accepted
- Date: 2026-09-21
- Owner: platform

## Context

The template must be a single starting point for a typed full-stack application:
a React client, a NestJS server, and the contracts they share. Previously the
client and server were separate packages with their own lockfiles and no shared
code, which allowed request/response shapes to drift and duplicated
configuration.

## Decision

1. One repository, one lockfile, npm workspaces with `apps/*` and `packages/*`.
2. `apps/client` and `apps/server` are the deployable units (`@repo/client`, `@repo/server`).
3. Shared code lives in `packages/`:
   - `@repo/contracts` — zod schemas and inferred types used by both apps.
   - `@repo/tsconfig` — TypeScript presets (`base`, `node`, `react`).
   - `@repo/eslint-config` — ESLint flat-config presets (`base`, `node`, `react`).
4. `@repo/contracts` is compiled to `dist` with `tsc`; the server and client consume the compiled output. The root `dev` script runs a contracts watch build alongside the apps.
5. The root `package.json` owns cross-cutting scripts (`dev`, `build`, `lint`, `typecheck`, `test`) so local verification matches CI.
6. Tooling stays minimal: npm workspaces only. No Turborepo, Nx, pnpm, or project references unless a concrete need appears.

## Consequences

Positive: one install, one lockfile, one place to define wire contracts, consistent config, and a single CI command set.

Negative: hoisting can hide an undeclared dependency; the contracts package must be built before the apps typecheck or build; generated route trees and migration artifacts must be treated consistently (see `docs/database.md` and `apps/client/src/routeTree.gen.ts`).

## Alternatives considered

- Two separate repositories with a published contracts package — heavier release ceremony, slower iteration.
- Turborepo/Nx — task caching not worth the added configuration at this size; can be layered on later without changing the layout.
