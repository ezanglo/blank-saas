# Blank SaaS

**Blank SaaS** is a multi-tenant **Next.js 16** starter with **Payload CMS** (Postgres), **Better Auth** (email + orgs + invitations), billing hooks for **Stripe**, outbound/inbound webhooks (**Svix**), quotas and API rate limits, optional **SSO/SAML**, **PostHog** hooks, and **S3-compatible** uploads. It is meant to fork into a real product: core paths are documented in the PRD phase docs under `docs/prd-v4-phases/`.

## What you get

| Feature | Why included | Where / env |
|--------|----------------|-------------|
| **Organizations, members, invitations** | B2B tenancy without bolting auth twice | App Router under `src/app/(frontend)/(protected)/organizations/`, Better Auth — `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`; optional `POST /api/invitations/accept` |
| **Billing (Stripe)** | Checkout, portal, webhooks as a starting point | `src/lib/billing/`, `STRIPE_*`, webhook `POST /api/webhooks/stripe` |
| **Quotas & API rate limits** | Fair use before full monetization | `src/lib/quota/`, optional `REDIS_URL` (Upstash or Docker) |
| **Org webhooks (Svix)** | User-facing webhook CRUD + delivery | `SVIX_*`, `POST /api/webhooks/svix` |
| **Audit logs** | Operator visibility for sensitive actions | Org settings → Audit logs; see [phase 6](docs/prd-v4-phases/phase-06-audit-flags-quotas-webhooks.md) |
| **SSO / SAML** | Enterprise sign-in | Better Auth SSO routes, optional Jackson — `JACKSON_*`, [phase 9](docs/prd-v4-phases/phase-09-sso-saml.md) |
| **Granular permissions** | Payload-backed org roles (feature-flagged) | `NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS`, [phase 10](docs/prd-v4-phases/phase-10-granular-permissions.md) |
| **PostHog** | Product analytics wiring | `NEXT_PUBLIC_POSTHOG_*`, [phase 8](docs/prd-v4-phases/phase-08-posthog.md) |
| **Payload CMS `/admin`** | Content and admin UI for operators | `PAYLOAD_SECRET`, `src/payload.config.ts` (do not hand-edit `(payload)` routes — see [AGENTS.md](AGENTS.md)) |
| **S3-compatible uploads** | Media via Payload storage adapter | `S3_*` (MinIO locally, AWS/S3 in prod) |
| **Docker dev stack** | One command for Postgres, Redis, MailHog, MinIO, Svix | `docker-compose.dev.yml`, [phase 11](docs/prd-v4-phases/phase-11-docker-tests-readme.md) |
| **Tests** | Unit, integration, Playwright E2E | `pnpm test:unit`, `pnpm test:integration`, `pnpm test:e2e` |
| **Security headers & optional CSP / Sentry** | Production hardening without a custom deploy fork | `SECURITY_*`, `SENTRY_*` in [`.env.example`](.env.example), [`docs/runbooks/`](docs/runbooks/README.md) |

**Deep dives:** Implementation details and checklists live in [`docs/prd-v4-phases/README.md`](docs/prd-v4-phases/README.md) (phases 1–12). Production operations (Stripe, Svix, Redis, PostHog, CSP) are in [`docs/runbooks/`](docs/runbooks/README.md).

## Start here

Follow **Quick start** below for your first local run. For **production**, see **[Deployment](#deployment)** (Docker vs Vercel). For email template development, run **`pnpm email:dev`** to preview React Email templates in `src/lib/email/templates`.

## Forking & shipping your product

1. **Rename and brand** — change `name` in [`package.json`](package.json), set `NEXT_PUBLIC_APP_URL` and copy in prod domains; update app metadata and marketing copy under `src/app/(frontend)/(marketing)/`.
2. **Secrets** — copy `.env.example` → `.env.local`; never commit secrets. Use platform env vars in production (see [`.env.example`](.env.example) comments for Docker vs Next).
3. **Database** — run `pnpm migrate` after clone; after you change Payload collections, use the flow in **Schema and migrations** below (generated migrations only — see [AGENTS.md](AGENTS.md)).
4. **Strip what you do not need** — e.g. disable Stripe/Svix/SSO env vars and remove or ignore UI routes; use phase docs to see what each module depends on.

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

## Deployment

Two common ways to run this app in production: **everything under your control in Docker**, or **Next.js on Vercel** with managed databases and SaaS integrations.

### A — Full Docker (self‑hosted)

**What the repo gives you**

- [`docker-compose.dev.yml`](docker-compose.dev.yml) — Postgres, Redis, MailHog, MinIO, Svix (and optional Jackson with `--profile jackson`). Good for **local** dev and as a template for what to run in prod.
- [`docker-compose.docker-app.yml`](docker-compose.docker-app.yml) + [`pnpm docker:app`](package.json) — same dependencies plus a **`web`** service that builds and runs the Next.js app (`next build` / `next start`) in Docker. See **Quick start → Production-like — entire stack in Docker** above for env files and `DATABASE_URL_BUILD` when Postgres is not on `5432`.

**What you still need to add yourself**

| Concern | Notes |
|--------|--------|
| **Host & TLS** | A VM, Kubernetes, or Docker host. Terminate TLS at a reverse proxy (e.g. Caddy, Traefik, nginx) or a load balancer; point DNS to it. |
| **Secrets** | Production values in env files or your orchestrator — **never** commit them. Mirror variables from [`.env.example`](.env.example): `DATABASE_URL`, `PAYLOAD_SECRET`, `BETTER_AUTH_SECRET`, `NEXT_PUBLIC_APP_URL`, `BETTER_AUTH_URL`, optional `REDIS_URL`, `SMTP_*`, `S3_*`, `SVIX_*`, etc. |
| **Real email** | Replace MailHog with SMTP (transactional provider or your relay). Set `SMTP_*`; for the marketing **contact form**, set `CONTACT_INBOX` if you want mail routed to an inbox. |
| **Real object storage** | Replace MinIO with AWS S3, Cloudflare R2, or another S3-compatible API; update `S3_*` (and CORS / public URLs as your adapter requires). |
| **Svix** | Keep the **container** from Compose, or use **Svix Cloud** and set `SVIX_SERVER_URL` + `SVIX_AUTH_TOKEN` to the cloud API (see [runbook](docs/runbooks/svix.md)). |
| **Rate limits** | Keep Redis from Compose, or use **Upstash** (`UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN`) if you prefer serverless-friendly Redis. |
| **PostHog** | Not bundled in Compose; use [PostHog Cloud](https://posthog.com) or run their [self-hosted](https://posthog.com/docs/self-host) stack separately. |
| **Stripe / SAML / OAuth** | Optional features need the same keys as in cloud deploys (Stripe Dashboard, identity providers, Google/GitHub OAuth apps) with **public HTTPS callback URLs** for your domain. |
| **Ops** | Backups for Postgres and object storage; health checks; log aggregation; updates for the image and base images. |

For Svix JWT and dev vs prod wiring, see [Phase 11 — Docker & tests](docs/prd-v4-phases/phase-11-docker-tests-readme.md).

### B — Vercel + third‑party accounts

Deploy the Next.js app to **[Vercel](https://vercel.com)** (import the GitHub repo, default **Next.js** preset, Node **22**). Set environment variables in the project (Dashboard → Settings → Environment Variables or `vercel env`).

**Core (required for a working app)**

| Service | Role | What to create |
|--------|------|----------------|
| **Vercel** | Hosts the Next.js app | Project linked to your repo; production domain and HTTPS. |
| **Postgres** | Payload + app data | e.g. [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres), [Neon](https://neon.tech), [Supabase](https://supabase.com), or any managed Postgres. Copy **`DATABASE_URL`** (SSL required by most hosts). Run **`pnpm migrate`** against production from CI or a one-off job so schema is applied — same as local (see **Schema and migrations** below). |
| **Secrets** | Crypto & sessions | Generate **`PAYLOAD_SECRET`** and **`BETTER_AUTH_SECRET`**. |
| **URLs** | Auth & links | **`NEXT_PUBLIC_APP_URL`** and **`BETTER_AUTH_URL`** (and **`SITE_URL`** if you use it) must be your **production** `https://` origin — no trailing path. Add the same domains in Better Auth / OAuth provider settings. |

**Common add‑ons (enable only what you use)**

| Service | Env hints | Account / setup |
|--------|-----------|-------------------|
| **Redis / rate limits** | `REDIS_URL` *or* `UPSTASH_REDIS_REST_*` | [Upstash Redis](https://upstash.com) (recommended with Vercel) or any TCP Redis URL. Without Redis, API rate limiting degrades gracefully per [`limiter`](src/lib/quota/limiter.ts). |
| **Object storage** | `S3_*` (or R2-style vars if you wire them in Payload) | [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/), AWS S3, etc. Create a bucket, access keys, and CORS rules for your domain if browsers upload directly. |
| **Email** | `SMTP_*` | [Resend](https://resend.com), Postmark, Amazon SES, etc. Use SMTP or adapter-supported providers. |
| **Contact inbox** | `CONTACT_INBOX` | Address that receives `/api/contact` submissions (with SMTP). |
| **Stripe** | `STRIPE_*`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [Stripe Dashboard](https://dashboard.stripe.com) — API keys, webhook endpoint `https://<your-domain>/api/webhooks/stripe`, price IDs for your products. See [runbook](docs/runbooks/stripe.md). |
| **Svix (org webhooks)** | `SVIX_*` | [Svix Cloud](https://www.svix.com) or self-host Svix elsewhere and point `SVIX_SERVER_URL` at it. See [runbook](docs/runbooks/svix.md). |
| **PostHog** | `NEXT_PUBLIC_POSTHOG_*`, optional `POSTHOG_PERSONAL_API_KEY` | [PostHog](https://posthog.com) project. See [phase 8 / runbook](docs/runbooks/posthog.md). |
| **Google / GitHub sign-in** | `GOOGLE_*`, `GITHUB_*` | Google Cloud Console & GitHub OAuth Apps — authorized redirect URIs must match your deployment (e.g. `https://your-domain/api/auth/callback/google`). |
| **Sentry** | `SENTRY_*`, `NEXT_PUBLIC_SENTRY_DSN` | [Sentry](https://sentry.io) project; optional source map upload token for releases. |
| **SSO / SAML** | `JACKSON_*`, `SAML_*` | Optional [BoxyHQ Jackson](https://boxyhq.com/jackson) or your IdP — see [phase 9](docs/prd-v4-phases/phase-09-sso-saml.md). |

**Build-time note:** The Docker image passes `DATABASE_URL` (and some `NEXT_PUBLIC_*`) as build args for `next build`. On Vercel, configure **`DATABASE_URL`** (and any required `NEXT_PUBLIC_*`) for the **Production** environment so builds that touch the DB or prerender can succeed; align with [Vercel env vars](https://vercel.com/docs/projects/environment-variables) for Preview vs Production.

**After deploy:** Run database migrations once (`pnpm migrate` with production `DATABASE_URL` from your laptop or a CI step). Verify routes, webhooks (Stripe/Svix), and `docs/runbooks/staging-checklist.md` for staging/production checks.

## Schema and migrations (Payload)

After changing Payload collections:

1. `pnpm generate:db-schema`
2. `pnpm generate:types`
3. `pnpm migrate:create` (Payload CLI — do not hand-edit migration files)
4. Import the new migration in `src/migrations/index.ts` if needed, then `pnpm migrate`

See [AGENTS.md](AGENTS.md).

## Docker — production-style dependencies

This overlaps with **[Deployment](#deployment)** — use **A — Full Docker** for the full checklist. In short:

- **`docker-compose.yml`** — Postgres, Redis, Svix, optional Jackson (see file for profiles). Use for **dependency-only** stacks without MailHog/MinIO from dev compose.
- **`docker-compose.dev.yml`** — full local dev: add MailHog + MinIO; preferred for day-to-day development.
- **`docker-compose.docker-app.yml`** — adds the **`web`** app service; use **`pnpm docker:app`** so Postgres is up before the Docker build.

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
| `pnpm email:dev` | Preview transactional email templates (`src/lib/email/templates`) |

Playwright starts `pnpm dev` automatically unless a server is already running (`reuseExistingServer` is off in CI). Set `PLAYWRIGHT_BASE_URL` to target another deployment.

**CI note:** The first user in an empty database is auto-verified; E2E uses fresh flows suitable for that rule. Enable granular permissions UI in CI via `NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS=true` (see [`.github/workflows/ci.yml`](.github/workflows/ci.yml)).

## Production operations

Operator-facing runbooks (Stripe webhooks, Svix, Redis/Upstash rate limits, PostHog, CSP rollout, staging verification, route guards, SAML matrix) live under [`docs/runbooks/`](docs/runbooks/README.md). Security headers and optional Sentry integration are wired in [`next.config.ts`](next.config.ts) — see comments in [`.env.example`](.env.example) for `SECURITY_*` and `SENTRY_*` variables.

**Invitation accept HTTP API:** `POST /api/invitations/accept` with JSON `{ "invitationId": "<id>" }` and the signed-in user’s cookies (same semantics as the invite UI). `GET /api/invitations/accept?invitationId=<id>` redirects to `/invite/<id>`.

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
