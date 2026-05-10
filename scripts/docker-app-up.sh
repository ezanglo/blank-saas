#!/usr/bin/env sh
set -eu

ROOT="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT"

ENV_FILE="${ENV_FILE:-.env.local}"

COMPOSE_ENV=""
if [ -f .env ]; then
  COMPOSE_ENV="$COMPOSE_ENV --env-file .env"
fi
if [ -f "$ENV_FILE" ]; then
  COMPOSE_ENV="$COMPOSE_ENV --env-file $ENV_FILE"
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found" >&2
  exit 1
fi

docker compose -f docker-compose.dev.yml up -d postgres redis mailhog minio svix

echo "Waiting for Postgres..."
until docker compose -f docker-compose.dev.yml exec -T postgres pg_isready -U postgres -d blank_saas >/dev/null 2>&1; do
  sleep 1
done

# shellcheck disable=SC2086
docker compose $COMPOSE_ENV -f docker-compose.docker-app.yml build web
# shellcheck disable=SC2086
docker compose $COMPOSE_ENV -f docker-compose.docker-app.yml up -d web

echo "Web: http://localhost:${APP_PORT:-3000}"
