#!/bin/sh
set -e

cd /app

echo "[entrypoint] applying database migrations"
npm run db:migrate -w @repo/server

echo "[entrypoint] starting server"
exec node apps/server/dist/main.js
