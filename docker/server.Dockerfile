# syntax=docker/dockerfile:1

# ---- build ------------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/server/package.json apps/server/package.json
COPY apps/client/package.json apps/client/package.json
COPY packages/contracts/package.json packages/contracts/package.json
COPY packages/tsconfig/package.json packages/tsconfig/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json

RUN npm ci

COPY . .
RUN npm run build -w @repo/contracts && npm run build -w @repo/server

# ---- runtime ----------------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# The runtime image carries the workspace so the @repo/* symlinks resolve and
# so the entrypoint can run `drizzle-kit migrate` (a dev dependency) before
# booting. For a smaller image, prune after migrating in a release pipeline.
COPY --from=build /app /app

COPY docker/server-entrypoint.sh /usr/local/bin/server-entrypoint.sh
RUN chmod +x /usr/local/bin/server-entrypoint.sh

WORKDIR /app/apps/server
EXPOSE 3001
ENTRYPOINT ["/usr/local/bin/server-entrypoint.sh"]
