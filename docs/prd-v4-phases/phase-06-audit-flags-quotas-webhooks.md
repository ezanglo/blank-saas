# Phase 6 — Audit logs, feature flags, quotas, webhooks (Svix)

Maps to **Phase 6** and PRD **§13–16**, **§14**, **§26** steps **17–20**.

## Purpose

Observability and platform mechanics: internal audit trail, feature flags backed by Postgres, Redis quotas/rate limits, outbound webhooks via Svix.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§13 Audit logs](../../nextjs-multitenant-starter-PRD-v4.md) | Collection, events, logger, UI |
| [§15 Feature flags](../../nextjs-multitenant-starter-PRD-v4.md) | `flags` SDK, Payload `FeatureFlags`, adapter |
| [§16 Usage quotas & rate limiting](../../nextjs-multitenant-starter-PRD-v4.md) | Plans, `checkQuota()`, usage API + dashboard |
| [§14 Webhooks (Svix)](../../nextjs-multitenant-starter-PRD-v4.md) | Docker, client, events, per-org app, UI |
| [§10.5 CSV export](../../nextjs-multitenant-starter-PRD-v4.md) | Audit logs export |

## Prerequisites

- Phase 5 org flows (to instrument meaningful events).
- Redis for quotas; Svix service from compose (Phase 11 can add container; client code here).

## Deliverables (checklist)

- [ ] `src/lib/audit/events.ts` + `createAuditLog()` + instrument org/member/account mutations.
- [ ] `src/app/(dashboard)/organizations/[orgSlug]/audit-logs` + table, filters, CSV.
- [ ] Feature flags: `src/lib/flags/adapter.ts`, `flags.ts`, Payload admin management §15.
- [ ] `src/lib/quota/plans.ts`, `limiter.ts`, `check.ts`; `GET /api/orgs/[orgId]/usage` (path per PRD repo structure §3).
- [ ] Usage dashboard page §16.6.
- [ ] Svix: `src/lib/webhooks/svix.ts`, `events.ts`, `sendWebhook()`, per-org app provisioning §14.
- [ ] Webhook endpoint management UI under org §14.7.
- [ ] `src/app/api/webhooks/svix/route.ts` operational handler §14.8.

## Key paths (expected)

```
src/lib/audit/
src/payload/collections/AuditLogs.ts
src/lib/flags/
src/lib/quota/
src/lib/webhooks/
src/app/api/webhooks/svix/route.ts
```

## Verification

- Creating an org emits `org.created` audit (PRD test list §23.2).
- Flag decision reads from Payload adapter.
- Quota exceeded path returns structured error from `checkQuota()` §16.4.
- Svix JWT token documented in README Phase 11.

## Env vars

- `REDIS_URL` (or Upstash)
- `SVIX_SERVER_URL`, `SVIX_AUTH_TOKEN`, `SVIX_JWT_SECRET` (PRD §24.4)

## Notes

- Keep audit + outbound webhook calls non-blocking or handle failures so user actions do not fail silently (PRD implies instrumentation on mutating actions).
