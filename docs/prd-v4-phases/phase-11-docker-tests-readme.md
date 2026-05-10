# Phase 11 — Docker, Playwright, unit/API tests, README, polish

**Status:** **complete** — Docker + Vitest + Playwright + CI + README + `.env.example` parity are in repo; expand unit/integration depth incrementally per phase docs as features grow.

Maps to **Phase 11** and PRD **§24**, **§23**, **§27**, **§10**, **§26** steps **21, 26–28**, plus **repo conventions for unit and API/integration tests** (PRD §23 is E2E-only; this file extends it).

## Purpose

Containerized dev/prod, **three layers of automated tests** (unit, API/integration, E2E), onboarding docs, and global error/loading polish.

## Testing — when to write what

| Layer | What it covers | **When to add tests** | **When to run** |
|--------|----------------|----------------------|-----------------|
| **Unit** | Pure functions: quota/plan math, query-key factories, Zod refinements, small helpers extracted from `proxy` (if you split “decide redirect” from Next types) | **As soon as the module exists** (same PR as the feature, or the phase that introduces the rule). Prefer writing when logic has branches/edge cases. | Locally on save or pre-commit; **CI on every PR** once Phase 11 wires scripts. |
| **API / integration** | Route handlers, server actions, Payload `access` / local API with a **test DB** (or isolated schema), better-auth flows that need cookies | **When the HTTP/API surface is stable enough** (usually end of the phase that ships the feature:e.g. Phase 5 for org actions, Phase 6 for webhooks/quotas, Phase 7 for Stripe webhooks). Not before the contract exists, or you’ll churn tests. | **CI on every PR** against compose services or a ephemeral DB job. |
| **E2E (Playwright)** | Full browser journeys (PRD §23.2) | **Phase 11** is the bulk pass; you may add **smoke** E2E earlier (e.g. sign-in after Phase 4) if CI is ready. | CI on main + PRs; optional nightly. |

**Rule of thumb:** Unit tests lock **rules and algorithms**; integration tests lock **server contracts and auth/data access**; E2E locks **what users actually do**. Phase 11 is when you **formalize CI** (all three + Docker + README), not necessarily the first line of test code you ever write.

## Relationship to Phases 1–10

Each phase doc **[phase-01](phase-01-scaffold-and-design-system.md) … [phase-10](phase-10-granular-permissions.md)** includes **Tests (unit / integration)** checklists scoped to that phase’s deliverables. Treat those as **what to write alongside the feature**. Phase 11 **does not replace** them—it adds **`vitest.config.ts`**, **`pnpm test:unit`** / **`test:integration`**, Playwright, Docker, and the CI job that runs the accumulated suite.

## Testing — where files live (repo convention)

PRD §23 only specifies Playwright paths. Use these in addition:

```
tests/e2e/              # Playwright specs (*.spec.ts) — PRD §23.1
tests/fixtures/         # E2E helpers, auth state, MailHog assumptions — §23.3
tests/unit/             # Vitest (or Jest) — mirrors src/lib/** layout where helpful
tests/integration/      # Vitest + fetch / Payload local API / test DB
```

- **Colocated alternative:** `src/**/__tests__/*.test.ts` or `src/**/*.test.ts` for unit tests only—pick one style per area and stay consistent.
- **Naming:** `*.test.ts` for unit/integration; `*.spec.ts` for Playwright under `tests/e2e/`.

## Deliverables — automated tests (extended checklist)

**E2E (PRD §23)**

- [x] `playwright.config.ts` §23.1; `tests/fixtures/` §23.3.
- [x] Spec files §23.2 — [`tests/e2e/`](../../tests/e2e/) (`auth`, `marketing`, `organizations`, `members`, `invitations`, `audit-logs`, `webhooks`, `quota`, `billing`, `permissions`, `sso`).
- [x] `sso` — [`tests/e2e/sso.spec.ts`](../../tests/e2e/sso.spec.ts) (`pnpm test:e2e`).
- [x] `pnpm test:e2e` runs in CI ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)) with Postgres service + migrate.

**Unit + API/integration (repo extension)**

- [x] `vitest.config.ts` at repo root; `pnpm run test:unit` / `pnpm run test:unit:watch` ([`vitest.config.ts`](../../vitest.config.ts)).
- [x] `pnpm run test:integration` — [`tests/integration/`](../../tests/integration/) (`sso-actions`, `permissions-actions`, **`org-api-routes`**, **`member-invite-action`**); runs in CI with migrated DB env.
- [x] Baseline unit coverage colocated as `src/**/*.test.ts` (quota/limiter, guards, schemas, etc.) — expand per phase checklists as surfaces grow.
- [x] **HTTP handlers:** besides workflow-focused [`tests/integration/`](../../tests/integration/), selected **`src/app/api/**`** routes use **colocated** `route.test.ts` (for example `src/app/api/orgs/[orgId]/usage/route.test.ts`, Stripe and Svix webhook routes).
- [ ] Optional next waves: more **`src/app/api/**`** routes + server actions under [`tests/integration/`](../../tests/integration/) when a surface stabilizes or regressions repeat.
- [x] CI workflow runs **lint**, **typecheck**, **`test:unit`**, **`test:integration`**, **`test:e2e`** (e2e job after verify).

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§24 Docker](../../nextjs-multitenant-starter-PRD-v4.md) | compose prod + dev, Dockerfile |
| [§23 Testing — Playwright](../../nextjs-multitenant-starter-PRD-v4.md) | Config + all E2E specs |
| [§27 README](../../nextjs-multitenant-starter-PRD-v4.md) | Setup, migrations order, services |
| [§10 Error & loading](../../nextjs-multitenant-starter-PRD-v4.md) | `error.tsx`, 403, skeletons |
| [§24.4 .env.example](../../nextjs-multitenant-starter-PRD-v4.md) | Full variable list |

## Prerequisites

- Features from Phases 1–10 implemented enough for specs to run (or skip/xfail with clear tags).

## Deliverables (checklist — infra + polish)

- [x] `docker-compose.yml` + `docker-compose.dev.yml` — Postgres, Redis, Svix; optional **Jackson** (`--profile jackson`); dev adds **MailHog**, **MinIO** §24.1–24.2 (PostHog: Cloud / self-host per README, not bundled).
- [x] `Dockerfile` multistage §24.3 + optional **`docker-compose.docker-app.yml`** / **`pnpm docker:app`** for production-like **`next start`** locally.
- [x] `.env.example` mirroring §24.4 + Svix / Compose notes §27.
- [x] Global `(frontend)` error boundaries — `src/app/(frontend)/error.tsx`, `src/app/(frontend)/not-found.tsx`; org hub surfaces forbidden query param §10.
- [x] README §27-style quick start: Compose, migrations, MailHog/MinIO/Svix/Stripe/PostHog/Jackson, **Testing** table (lint / typecheck / unit / integration / E2E).

## Key paths (expected)

```
docker-compose.yml
docker-compose.dev.yml
docker-compose.docker-app.yml   # optional: deps + web (next start)
Dockerfile
.env.example
playwright.config.ts
vitest.config.ts
scripts/docker-app-up.sh
tests/e2e/
tests/fixtures/
tests/integration/
README.md
```

## Verification

- `docker compose -f docker-compose.dev.yml up -d` brings dev deps §27; optional `pnpm docker:app` runs **`next start`** in Docker.
- `pnpm test:e2e` passes locally / in CI (with migrate + Postgres).
- `pnpm test:unit` and `pnpm test:integration` pass in CI with documented env.
- New contributor can boot from README only.
- Production operations runbooks (Stripe, Svix, Redis limits, PostHog, CSP, staging smoke): [`docs/runbooks/README.md`](../../docs/runbooks/README.md).

## Svix environment (Phase 6)

For outbound webhooks and the operational webhook handler, configure (see [`.env.example`](../../.env.example)):

- **`SVIX_SERVER_URL`** — Svix API base (e.g. `http://localhost:8071` for self-hosted, or cloud URL).
- **`SVIX_AUTH_TOKEN`** — Server API token used by the app to create apps/endpoints and send events.
- **`SVIX_JWT_SECRET`** — Used by the **Svix server** container for JWT signing (set in compose when running local Svix; not the same as the app auth token).
- **`SVIX_WEBHOOK_SECRET`** — Signing secret for **`POST /api/webhooks/svix`** (operational events from Svix). Format `whsec_` + base64 payload; must match the secret configured for that endpoint in Svix.

Feature flags precompute (optional): set **`FLAGS_SECRET`** so [`src/proxy.ts`](../../src/proxy.ts) can emit the flags cookie consumed by [`resolveWebhooksEnabledFlag`](../../src/lib/flags/resolver.ts).

## Notes

- Production checklist §27: real S3/SMTP, managed Redis option, admin email restriction, Stripe webhook URL, etc.
- PRD §23 does not define unit/API tests; treat this doc as the **source of truth** for those layers on this repo.

## Phase reference index

Return to [README.md](README.md) for the full phase table.
