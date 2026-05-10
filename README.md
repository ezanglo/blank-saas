# Blank SaaS

Multi-tenant Next.js 16 + Payload CMS + Better Auth starter (organizations, billing hooks, quotas, webhooks, SAML SSO via Better Auth).

## Prerequisites

- **Node.js** 22+
- **pnpm** 10+ (`corepack enable` recommended)
- **Docker** (optional, for local Postgres, Redis, Svix, MailHog, MinIO)

## Quick start

1. **Clone and install**

   ```bash
   pnpm install
   ```

2. **Start infrastructure** (recommended)

   ```bash
   docker compose -f docker-compose.dev.yml up -d
   ```

   This brings up PostgreSQL 16, Redis 7, Svix server, MailHog (SMTP `1025`, UI [http://localhost:8025](http://localhost:8025)), MinIO ([http://localhost:9000](http://localhost:9000), console [http://localhost:9001](http://localhost:9001)), and optional Jackson with `--profile jackson`. Override published ports via root `.env` when defaults clash with other stacks (see bullets below).

   - **Port `5432` busy**: set `POSTGRES_PORT=5434` (or any free port) in root `.env` and use that port in `DATABASE_URL` inside `.env.local`.

   - **Port `6379` busy** (Homebrew Redis, another Compose stack): `REDIS_PORT=6380` in root `.env`, then `REDIS_URL="redis://127.0.0.1:6380"` in `.env.local`. Svix still uses `redis:6379` on the Compose network.

   - **MailHog SMTP/UI busy**: `MAILHOG_SMTP_PORT` / `MAILHOG_UI_PORT` in root `.env`; match `SMTP_PORT` in `.env.local` and open MailHog UI at the mapped UI port.

   - **Database URL** for this compose stack:

     ```bash
     DATABASE_URL="postgres://postgres:postgres@127.0.0.1:5432/blank_saas"
     ```

     If you use `POSTGRES_PORT` in `.env`, use that port in `DATABASE_URL` instead of `5432`.

   - **Svix DB**: on a **fresh** Postgres volume, `docker/postgres-init/01-create-svix-db.sql` creates the `svix` database. If your volume already existed before that script was added, create it once:

     ```bash
     docker compose -f docker-compose.dev.yml exec postgres \
       psql -U postgres -c "CREATE DATABASE svix;"
     ```

   - **Svix auth token** (for the app to talk to Svix): see [Phase 11 — Svix environment](docs/prd-v4-phases/phase-11-docker-tests-readme.md#svix-environment-phase-6) and run JWT generation inside the Svix container per [Svix docs](https://github.com/svix/svix-webhooks).

   - **PostHog**: use [PostHog Cloud](https://posthog.com) or follow [self-hosted Docker](https://posthog.com/docs/self-host/deploy/docker). A full hobby stack is not bundled here.

3. **Environment**

   ```bash
   cp .env.example .env.local
   ```

   Fill at least `DATABASE_URL`, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`.

   `.env.example` is ordered **Docker-first** (Postgres, Redis, MailHog, MinIO, Svix), then core secrets, then optional cloud services.

   **Compose-only overrides:** Docker Compose reads a root `.env` file for `${VAR}` substitution (e.g. `SVIX_JWT_SECRET`, `MINIO_ROOT_*`) — it does **not** load `.env.local`. See comments at the top of `.env.example`.

   For **MailHog** email in dev:

   ```bash
   SMTP_HOST=127.0.0.1
   SMTP_PORT=1025
   SMTP_FROM="Blank SaaS <no-reply@localhost>"
   ```

   For **MinIO** as S3-compatible storage:

   ```bash
   S3_BUCKET=blank-saas
   S3_REGION=us-east-1
   S3_ENDPOINT=http://127.0.0.1:9000
   S3_ACCESS_KEY_ID=minioadmin
   S3_SECRET_ACCESS_KEY=minioadmin
   ```

4. **Migrations**

   ```bash
   pnpm migrate
   ```

   Skip this when using **`pnpm docker:app`** — the `web` container runs Payload migrations before `next start`.

5. **Run the app**

   **Hot reload (default)** — app on the host, Compose for deps only:

   ```bash
   pnpm dev
   ```

   **Production-like — entire stack in Docker** — [`docker-compose.docker-app.yml`](docker-compose.docker-app.yml) builds and runs the [`Dockerfile`](Dockerfile) (`next build` + `next start`). Postgres must be running **before** the image build so Payload can reach the DB via `host.docker.internal`:

   ```bash
   pnpm docker:app
   ```

   This starts Postgres/Redis/MailHog/MinIO/Svix, waits for Postgres, builds `web`, then runs migrations and serves on [http://localhost:3000](http://localhost:3000) (override with `APP_PORT`). Compose reads root `.env` for port substitution; pass secrets via `.env.local` (the script passes `--env-file .env` then `--env-file .env.local` when present).

   If **`POSTGRES_PORT`** is not `5432`, set **`DATABASE_URL_BUILD`** in root `.env` so it matches, for example:

   ```bash
   DATABASE_URL_BUILD=postgresql://postgres:postgres@host.docker.internal:5434/blank_saas
   ```

   Stop (containers only):

   ```bash
   docker compose --env-file .env.local -f docker-compose.docker-app.yml down
   ```

   (Add `-v` only if you intend to delete Postgres/MinIO volumes.)

   Open [http://localhost:3000](http://localhost:3000). The **first** email/password sign-up is auto-verified and promoted to admin so you can sign in immediately.

## Schema and migrations (Payload)

After changing Payload collections:

1. `pnpm generate:db-schema`
2. `pnpm generate:types`
3. `pnpm migrate:create` (Payload CLI — do not hand-edit migration files)
4. Import the new migration in `src/migrations/index.ts` if needed, then `pnpm migrate`

See [AGENTS.md](AGENTS.md).

## Docker — production-style dependencies

[`docker-compose.yml`](docker-compose.yml) mirrors PRD §24.1: Postgres, Redis, Svix, and optional Jackson (`--profile jackson`). For local development with MailHog and MinIO, prefer [`docker-compose.dev.yml`](docker-compose.dev.yml).

### Full stack + Next.js in Docker

[`docker-compose.docker-app.yml`](docker-compose.docker-app.yml) **includes** `docker-compose.dev.yml` and adds a **`web`** service (`next start`). Use **`pnpm docker:app`** so Postgres is up before `docker compose build web` (required because `next build` talks to the database).

Stop:

```bash
docker compose --env-file .env.local -f docker-compose.docker-app.yml down
```

### Manual image build

Build args must include a reachable **`DATABASE_URL`** (see Dockerfile). Example when Postgres is published on the host:

```bash
docker build -t blank-saas \
  --build-arg DATABASE_URL=postgres://postgres:postgres@host.docker.internal:5432/blank_saas \
  --build-arg NEXT_PUBLIC_APP_URL=http://localhost:3000 \
  .
```

## Testing

| Command | Purpose |
|--------|---------|
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript (`tsc --noEmit`) |
| `pnpm test:unit` | Vitest — `src/**/*.test.ts` |
| `pnpm test:integration` | Vitest — `tests/integration/**/*.test.ts` |
| `pnpm test` / `pnpm test:e2e` | Playwright (`tests/e2e`) |
| `pnpm exec playwright install chromium` | Browsers (first time) |

Playwright starts `pnpm dev` automatically unless a server is already running (`reuseExistingServer` is off in CI). Set `PLAYWRIGHT_BASE_URL` to target another deployment.

**CI note:** The first user in an empty database is auto-verified; E2E uses fresh flows suitable for that rule. Enable granular permissions UI in CI via `NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS=true` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Stripe (billing)

Use test keys from the Stripe Dashboard. Local webhook forwarding:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## SAML / SSO

Better Auth handles SAML at `/api/auth/sso/*`. Org owners configure connections under **Organization → Settings → SSO**. Optional **BoxyHQ Jackson** sidecar:

```bash
docker compose -f docker-compose.dev.yml --profile jackson up -d
```

## License

Private / your policy.
