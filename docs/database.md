# Database and migrations

The server uses Drizzle ORM with PostgreSQL. The schema is code-first in
`apps/server/src/db/schema.ts`; SQL migrations are generated from it and
committed under `apps/server/drizzle/`.

## Baseline

The template ships a single squashed baseline migration
(`apps/server/drizzle/0000_*.sql`) that creates only the better-auth tables
(`user`, `session`, `account`, `verification`). When you adopt the template for a
project with no data yet, you can regenerate the baseline from scratch.

## Workflow

1. Edit `apps/server/src/db/schema.ts`.
2. Generate a migration:

   ```bash
   npm run db:generate
   ```

3. Review the generated SQL under `apps/server/drizzle/`.
4. Apply it:

   ```bash
   npm run db:migrate
   ```

`db:push` exists for local experimentation but should not be used against
shared environments; always commit migrations.

## Environment

`drizzle.config.ts` reads `DATABASE_URL` from the environment. In development
that comes from `apps/server/.env` (loaded by the `db:*` scripts). In containers
it is provided by Compose.

## Migrations in production

The server container runs `db:migrate` on startup before booting (see
`docker/server-entrypoint.sh`). For a controlled rollout you can instead run the
migration as a one-off step before deploying the new image:

```bash
docker compose run --rm server npm run db:migrate -w @repo/server
```

Migrations are additive by default. For destructive changes, ship an
expand → migrate → contract sequence across releases.
