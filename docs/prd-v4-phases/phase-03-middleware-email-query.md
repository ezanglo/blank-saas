# Phase 3 — Middleware, email, TanStack Query

Maps to **Phase 3** and PRD **§4.4**, **§16.5**, **§20**, **§18**, **§26** steps **7–9**.

## Purpose

Centralize request gating (rate limits + session + org context), transactional email, and client data-fetching conventions.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§4.4 Middleware](../../nextjs-multitenant-starter-PRD-v4.md) | Rate limit → session → active org → membership guard |
| [§16.5 Rate limiting in middleware](../../nextjs-multitenant-starter-PRD-v4.md) | API `/api/*` limits |
| [§16.2–16.3 Limiter](../../nextjs-multitenant-starter-PRD-v4.md) | Redis + `@upstash/ratelimit` |
| [§20 Email](../../nextjs-multitenant-starter-PRD-v4.md) | Nodemailer + React Email templates |
| [§29.8 billing-alert](../../nextjs-multitenant-starter-PRD-v4.md) | Template (webhook may come Phase 7) |
| [§18 TanStack Query](../../nextjs-multitenant-starter-PRD-v4.md) | Query keys + hooks |

## Prerequisites

- Phase 2: auth + Redis URL if using rate limits (PRD uses Redis in compose).

## Deliverables (checklist)

- [ ] `src/middleware.ts` (or Next 16–equivalent per in-repo docs): ordered steps from PRD §4.4; extend PRD snippet for **slug resolution** + **membership** on `/organizations/[orgSlug]/*`.
- [ ] `src/lib/quota/limiter.ts` — IP limiter for middleware (`apiRateLimiter`).
- [ ] `src/lib/email/send.ts` + templates: `welcome`, `reset-password`, `invite-member`, `quota-warning`; add **`billing-alert`** when Stripe exists or stub props.
- [ ] TanStack Query **provider** in layout; `src/lib/query/keys.ts` (or equivalent) matching PRD §18.1; base hooks per §18.2.

## Key paths (expected)

```
src/middleware.ts
src/lib/quota/limiter.ts
src/lib/email/send.ts
src/lib/email/templates/
src/lib/query/keys.ts   # or lib/query-keys.ts
```

## Verification

- Unauthenticated access to dashboard routes redirects to `/login` with `callbackUrl`.
- Hitting API routes rapidly returns **429** when limit exceeded (test with a low threshold in dev).
- `npm run email:dev` previews templates (PRD §25).

## Env vars

- `REDIS_URL` (self-hosted) or Upstash REST vars (PRD §24.4)
- SMTP / MailHog (§24.4)

## Notes

- Wire magic-link and verification handlers in `auth.ts` to the same `send` helper (PRD §4.1).
