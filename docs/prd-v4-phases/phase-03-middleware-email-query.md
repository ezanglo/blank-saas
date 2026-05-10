# Phase 3 — Proxy (`proxy.ts`), email, TanStack Query

Maps to **Phase 3** and PRD **§4.4**, **§16.5**, **§20**, **§18**, **§26** steps **7–9**.

## Purpose

Centralize request gating (rate limits + session + org context), transactional email, and client data-fetching conventions.

**Next.js 16:** request interception uses **`src/proxy.ts`** with export **`proxy`** (Node.js runtime). Deprecated `middleware.ts` / `middleware()` should not be added new.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§4.4 Middleware](../../nextjs-multitenant-starter-PRD-v4.md) | Same ordered steps implemented in `proxy.ts`: rate limit → session → active org → membership guard |
| [§16.5 Rate limiting](../../nextjs-multitenant-starter-PRD-v4.md) | API `/api/*` limits |
| [§16.2–16.3 Limiter](../../nextjs-multitenant-starter-PRD-v4.md) | Redis + `@upstash/ratelimit` |
| [§20 Email](../../nextjs-multitenant-starter-PRD-v4.md) | Nodemailer + React Email templates |
| [§29.8 billing-alert](../../nextjs-multitenant-starter-PRD-v4.md) | Template (webhook may come Phase 7) |
| [§18 TanStack Query](../../nextjs-multitenant-starter-PRD-v4.md) | Query keys + hooks |

## Prerequisites

- Phase 2: auth + Redis URL if using rate limits (PRD uses Redis in compose).

## Deliverables (checklist)

- [x] `src/proxy.ts`: ordered steps from PRD §4.4; **slug resolution** + **membership** on `/organizations/[orgSlug]/*`; sign-in redirect uses **`/sign-in`** + **`callbackUrl`** (repo routes).
- [x] `src/lib/quota/limiter.ts` — `apiRateLimiter` (+ optional `createMonthlyQuotaLimiter`, `plans.ts`).
- [x] `src/lib/email/send.ts` + templates: `welcome`, `reset-password`, `invite-member`, `quota-warning`, `billing-alert` stub, plus `verify-email`, `magic-link`.
- [x] TanStack Query **provider** in [`src/components/providers.tsx`](../../src/components/providers.tsx); [`src/lib/query/keys.ts`](../../src/lib/query/keys.ts); hooks in [`src/lib/query/hooks.ts`](../../src/lib/query/hooks.ts) (some stubs until later phases).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — [`src/lib/quota/plans.ts`](../../src/lib/quota/plans.ts); [`src/lib/query/keys.ts`](../../src/lib/query/keys.ts); optional pure guards extracted from [`src/proxy.ts`](../../src/proxy.ts) (e.g. `src/lib/proxy-guards.ts`).
- **Integration** — limiter with **no Redis env**: allows requests; full Redis/Upstash sliding window in compose (Phase 11).

Checklist:

- [x] Unit: `PLANS` / `PlanKey`; query key factories — [`plans.test.ts`](../../src/lib/quota/plans.test.ts), [`keys.test.ts`](../../src/lib/query/keys.test.ts).
- [x] Unit: proxy decision helpers — [`proxy-guards.ts`](../../src/lib/proxy-guards.ts) + [`proxy-guards.test.ts`](../../src/lib/proxy-guards.test.ts).
- [x] Unit: API rate limiter — [`limiter.test.ts`](../../src/lib/quota/limiter.test.ts): no-Redis path allows; **`REDIS_URL`** path uses mocked `ioredis` to assert deny after `API_RATE_LIMIT_PER_MINUTE` (Upstash path not mocked here; validate manually or add Phase 11 integration).

## Key paths (expected)

```
src/proxy.ts
src/lib/quota/limiter.ts
src/lib/quota/plans.ts
src/lib/email/send.ts
src/lib/email/templates/
src/lib/query/keys.ts
src/lib/query/hooks.ts
```

## Verification

- Unauthenticated access to protected product routes (`/dashboard`, `/organizations`, `/account`, `/settings`) redirects to **`/sign-in`** with **`callbackUrl`**.
- Hitting API routes rapidly returns **429** when limit exceeded (set `API_RATE_LIMIT_PER_MINUTE` low and configure Redis / Upstash).
- `pnpm run email:dev` previews templates (React Email).

## Env vars

- `REDIS_URL` (self-hosted) or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (PRD §24.4)
- `API_RATE_LIMIT_PER_MINUTE` (optional)
- SMTP / MailHog (§24.4)

## Notes

- Magic-link, verification, and invitation flows use the shared `sendTransactionalEmail` helper from [`src/lib/email/send.ts`](../../src/lib/email/send.ts) via [`src/lib/auth.ts`](../../src/lib/auth.ts).
