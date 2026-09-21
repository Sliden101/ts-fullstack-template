# Deployment

The template ships container images for both apps and a Compose stack.

## Images

- `docker/server.Dockerfile` — builds `@repo/contracts` and `@repo/server`,
  then runs `node apps/server/dist/main.js`. The entrypoint applies pending
  migrations before starting.
- `docker/client.Dockerfile` — builds the Vite client and serves it with nginx,
  proxying `/graphql` and `/api` to the `server` service.

Build from the repository root (the build context needs the workspaces):

```bash
docker build -f docker/server.Dockerfile -t app-server .
docker build -f docker/client.Dockerfile -t app-client .
```

## Compose

```bash
cp .env.example .env   # set real secrets
docker compose up -d --build
docker compose exec server sh -c "cd /app && npm run seed:admin -w @repo/server"
```

- Client: http://localhost:3000
- API: http://localhost:3001/graphql
- Postgres: localhost:5432

For production, layer the override:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

## Environment

| Variable | Purpose |
| --- | --- |
| `APP_NAME` | Human-readable app name (auth, logs) |
| `PORT` | API port (default `3001`) |
| `NODE_ENV` | `production` enables secure cookies and quiet logs |
| `LOG_LEVEL` | Fastify/pino log level |
| `TRUSTED_ORIGINS` | Comma-separated allowed origins |
| `BETTER_AUTH_URL` | Public base URL of the API |
| `BETTER_AUTH_SECRET` | **Required.** Session signing secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Used by `seed:admin` |
| `POKEAPI_BASE_URL` | Upstream URL for the example feature |
| `VITE_API_URL` | Client API base (empty in dev to use the proxy) |

Never commit `.env`. Provide secrets through your platform's secret store.

## Health and readiness

- `GET /graphql` with `{ health }` returns `ok`.
- Compose gates `server` on the Postgres healthcheck.
- Add your platform's health probe against the `/graphql` health query or a
  dedicated REST route.

## Release checklist

1. Migrations are committed and reviewed.
2. `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build` pass in CI.
3. `BETTER_AUTH_SECRET` and database credentials are rotated per environment.
4. `NODE_ENV=production` so cookies are `secure`, `httpOnly`, `sameSite=lax`.
5. Rollback path: redeploy the previous image; migrations are additive.
