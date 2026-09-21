# Getting started

## 1. Install and configure

```bash
npm install
cp .env.example .env
```

Edit `.env` and set at least `BETTER_AUTH_SECRET` and the `ADMIN_*` values.
Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 2. Start Postgres and migrate

```bash
docker compose up -d db
npm run db:migrate
npm run seed:admin
```

## 3. Run everything

```bash
npm run dev
```

This runs three processes:

- `@repo/contracts` in watch mode (`tsc --watch`),
- the Nest API on `http://localhost:3001`,
- the Vite client on `http://localhost:3000` (proxying `/graphql` and `/api` to
  the API).

Sign in with the admin credentials from `.env`.

## Layout

```
apps/
  client/   React + TanStack + Tailwind
  server/   NestJS + Mercurius + Drizzle + Effect + better-auth
packages/
  contracts/       zod schemas shared by both apps
  tsconfig/        TypeScript presets
  eslint-config/   ESLint flat-config presets
docs/
  adr/             architecture decision records
  contracts/       wire contracts (errors, features)
```

## Adding a feature

The `pokemon` example is the reference vertical slice. To add a feature of your
own, follow the same path:

1. **Contract** — define the request/response zod schemas and inferred types in
   `packages/contracts/src/`.
2. **Domain (pure)** — put validation and mapping rules in
   `apps/server/src/domain/<feature>/`. Return `Result<T, DomainError>`; do not
   perform I/O.
3. **Data (optional)** — add tables to `apps/server/src/db/schema.ts` and run
   `npm run db:generate`.
4. **Module** — add `apps/server/src/modules/<feature>/` with a `.graphql` SDL
   file, a service returning Effects, a resolver (GraphQL) or controller (REST),
   and register the module in `apps/server/src/app.module.ts`.
5. **RBAC** — add the resource to `apps/server/src/auth/rbac.ts` and grant it to
   roles, then guard the resolver with `@UserHasPermission`.
6. **Tests** — add a domain unit test and a boundary test (see `Testing` below).
7. **Client** — add an API function under `apps/client/src/lib/` and a route
   under `apps/client/src/routes/_authenticated/`.

## Testing

- Server unit tests: `apps/server/test/unit/**` (vitest).
- Server e2e: `apps/server/scripts/e2e-*.ts`, which boot the real app on an
  ephemeral port and call it over HTTP/GraphQL. Run with a database and `.env`:
  `npm run test:e2e -w @repo/server`.
- Contracts: `packages/contracts/test/**`.
- Client: `apps/client/test/**` (vitest + testing-library).

Assert external behavior at a seam — the HTTP/GraphQL boundary, contract
parsing, or rendered UI — not implementation details.
