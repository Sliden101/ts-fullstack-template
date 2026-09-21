# Fullstack TypeScript Template

A reusable monorepo starting point for a typed full-stack application.

- **`apps/client`** — React 19, Vite, TanStack Router/Query/Form, Tailwind v4, shadcn-style UI kit.
- **`apps/server`** — NestJS 12, Fastify, Mercurius GraphQL, Drizzle/Postgres, Effect, better-auth.
- **`packages/contracts`** — zod schemas and inferred types shared by both apps.
- **`packages/tsconfig`** / **`packages/eslint-config`** — shared TypeScript and ESLint presets.

The template ships one complete vertical slice — a PokéAPI-backed `pokemon`
example — that exercises the shared contracts, the GraphQL API, the Effect
service boundary, and the client data layer end to end. Remove it once you have
your own feature, or run `npm run init` to scaffold a new project.

## Requirements

- Node.js >= 22 (see `.nvmrc`)
- PostgreSQL 17 (or use Docker Compose)

## Quick start

```bash
npm install
cp .env.example .env

# Start Postgres (or point DATABASE_URL at your own instance)
docker compose up -d db

# Apply the baseline migration and create an admin user
npm run db:migrate
npm run seed:admin

# Run the contracts watch build, the API, and the client together
npm run dev
```

- Client: http://localhost:3000
- GraphQL API: http://localhost:3001/graphql
- Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from your `.env`.

## Root scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Watch contracts, API, and client together |
| `npm run build` | Build contracts, server, and client |
| `npm run lint` | Lint both apps with the shared preset |
| `npm run typecheck` | Build contracts, then typecheck both apps |
| `npm run test` | Run the server and client test suites |
| `npm run db:generate` | Generate a Drizzle migration from the schema |
| `npm run db:migrate` | Apply pending migrations |
| `npm run seed:admin` | Create or update the admin user |
| `npm run init` | Scaffold a new project from this template |
| `npm run compose:up` | Run the full stack with Docker Compose |

Per-app scripts (database, e2e) live in `apps/server/package.json` and
`apps/client/package.json`; target them with `npm run <script> -w @repo/server`.

## Documentation

- [`docs/getting-started.md`](docs/getting-started.md) — project layout and first feature
- [`docs/database.md`](docs/database.md) — schema and migration workflow
- [`docs/deployment.md`](docs/deployment.md) — containers, environment, and release
- [`docs/branching.md`](docs/branching.md) — branching and release strategy
- [`docs/contracts/errors.md`](docs/contracts/errors.md) — error contract
- [`docs/adr/`](docs/adr/) — architecture decision records
- [`AGENTS.md`](AGENTS.md) — conventions for AI coding agents

## Using this as a template

1. Create a repository from this template (or copy the directory).
2. Run `npm run init` and answer the prompts (project name, package scope,
   default locale, whether to keep the example feature).
3. `npm install && npm run dev`.

## License

MIT — see [LICENSE](LICENSE).
