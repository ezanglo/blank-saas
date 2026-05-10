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

## Product routes (current app)

All org-scoped settings live under **`/organizations/[orgSlug]/settings/*`** (active org must match URL slug; see [`src/proxy.ts`](../../src/proxy.ts) and [`requireOrgContextForSlug`](../../src/lib/org/require-active-org.ts)).

| Surface | App Router path |
|---------|-----------------|
| General | [`.../settings/general`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/general/page.tsx) |
| Team | [`.../settings/team`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/team/page.tsx) |
| Usage | [`.../settings/usage`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/usage/page.tsx) |
| Audit logs (admin) | [`.../settings/audit-logs`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/audit-logs/page.tsx) |
| Webhooks (admin + flag) | [`.../settings/webhooks`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/webhooks/page.tsx) |

**Shell / navigation**

- [`SettingsNav`](../../src/components/settings/settings-nav.tsx) — vertical sidebar inside [`settings/layout.tsx`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/layout.tsx) (Finn-style: sticky aside + main).
- App sidebar: **Organization Settings** → `/organizations/{activeSlug}/settings/general` ([`app-sidebar.tsx`](../../src/components/app-sidebar.tsx)).
- Header: path-based breadcrumbs ([`site-header.tsx`](../../src/components/site-header.tsx)) — e.g. Organizations → workspace → Settings → section.
- Legacy top tab bar under `[orgSlug]` was removed; no separate `/settings/*` app routes (dev: no legacy redirects).

## Deliverables (checklist)

### Audit

- [x] Typed catalog + writer: [`src/lib/audit/events.ts`](../../src/lib/audit/events.ts), [`log.ts`](../../src/lib/audit/log.ts) (`createAuditLog` / fire-and-forget helpers).
- [x] List + filters: [`src/lib/audit/list.ts`](../../src/lib/audit/list.ts); UI [`AuditLogsView`](../../src/components/audit/audit-logs-view.tsx).
- [x] Payload collection [`src/collections/AuditLogs.ts`](../../src/collections/AuditLogs.ts) (access rules tightened for product use).
- [x] Instrumentation on org / member / invitation / account (and related) mutations — follow `fireAndForgetAuditLog` / `createAuditLog` usage in [`src/lib/actions/`](../../src/lib/actions/).
- [x] Admin-only audit UI under **`/organizations/[orgSlug]/settings/audit-logs`** (not the old PRD path under `(dashboard)`).
- [x] CSV export: [`GET /api/orgs/[orgId]/audit-logs/export`](../../src/app/api/orgs/[orgId]/audit-logs/export/route.ts).

### Feature flags

- [x] Adapter + definitions: [`src/lib/flags/adapter.ts`](../../src/lib/flags/adapter.ts), [`src/lib/flags/flags.ts`](../../src/lib/flags/flags.ts).
- [x] Payload collection [`src/collections/FeatureFlags.ts`](../../src/collections/FeatureFlags.ts) (`feature-flags` slug); admin-managed.
- [x] Example: webhooks gated via flag in settings layout / product paths.
- [x] `precompute(productFlags)` in [`src/proxy.ts`](../../src/proxy.ts) (when `FLAGS_SECRET` is set) + HttpOnly cookie; server UI resolves via [`resolveWebhooksEnabledFlag`](../../src/lib/flags/resolver.ts) with `getPrecomputed` to avoid duplicate Payload reads.

### Quotas & usage

- [x] Plans + math: [`src/lib/quota/plans.ts`](../../src/lib/quota/plans.ts), [`check.ts`](../../src/lib/quota/check.ts), Redis namespacing in [`limiter.ts`](../../src/lib/quota/limiter.ts).
- [x] `GET /api/orgs/[orgId]/usage`: [`route.ts`](../../src/app/api/orgs/[orgId]/usage/route.ts).
- [x] Usage UI: **`/organizations/[orgSlug]/settings/usage`** + [`OrgUsagePanel`](../../src/components/quota/org-usage-panel.tsx).
- [x] Quota warning email helper: [`src/lib/quota/warn-email.ts`](../../src/lib/quota/warn-email.ts).

### Webhooks (Svix)

- [x] Client + events + send: [`src/lib/webhooks/svix.ts`](../../src/lib/webhooks/svix.ts), [`events.ts`](../../src/lib/webhooks/events.ts), [`send.ts`](../../src/lib/webhooks/send.ts).
- [x] Per-org provisioning: [`src/lib/webhooks/provision.ts`](../../src/lib/webhooks/provision.ts) (org create/delete hooks in actions — verify in [`organization`](../../src/lib/actions/organization.ts) flows).
- [x] Endpoint CRUD server actions: [`src/lib/actions/org-webhooks.ts`](../../src/lib/actions/org-webhooks.ts); UI [`OrgWebhooksPanel`](../../src/components/org/org-webhooks-panel.tsx) at **`/organizations/[orgSlug]/settings/webhooks`**.
- [x] Operational handler: [`src/app/api/webhooks/svix/route.ts`](../../src/app/api/webhooks/svix/route.ts) + [`route.test.ts`](../../src/app/api/webhooks/svix/route.test.ts).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

| Check | Status |
|-------|--------|
| Unit: `checkQuota()` / plans ([`check.test.ts`](../../src/lib/quota/check.test.ts), [`plans.test.ts`](../../src/lib/quota/plans.test.ts)) | [x] |
| Unit: limiter ([`limiter.test.ts`](../../src/lib/quota/limiter.test.ts)) | [x] |
| Integration / unit: Svix inbound route ([`route.test.ts`](../../src/app/api/webhooks/svix/route.test.ts)) | [x] |
| Unit: audit list query keys ([`query/keys.test.ts`](../../src/lib/query/keys.test.ts)) | [x] |
| Unit: **`GET /api/orgs/[orgId]/usage`** gate + JSON shape ([`route.test.ts`](../../src/app/api/orgs/[orgId]/usage/route.test.ts), mocks `requireOrgMemberSession` / plan / summary) | [x] |
| Unit: audit event catalog + Zod samples ([`events.test.ts`](../../src/lib/audit/events.test.ts)) | [x] |

## Key paths (repo)

```
src/lib/audit/
src/collections/AuditLogs.ts
src/lib/flags/
src/lib/flags/resolver.ts
src/collections/FeatureFlags.ts
src/lib/quota/
src/lib/webhooks/
src/app/api/orgs/[orgId]/usage/route.ts
src/app/api/orgs/[orgId]/audit-logs/export/route.ts
src/app/api/webhooks/svix/route.ts
src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/
```

## Verification

- [x] Creating an org emits audit coverage for org lifecycle (see actions + PRD §23.2-style checklist when running manually).
- [x] Flag decision reads from Payload-backed adapter (`webhooks` flag example).
- [x] Quota exceeded path returns structured outcome from `checkQuota()` (throw / error surface in actions).
- [x] Svix env vars for operators: see [Phase 11 — Svix environment](phase-11-docker-tests-readme.md#svix-environment-phase-6) and [`.env.example`](../../.env.example) (`SVIX_*`).

## Env vars

See [`.env.example`](../../.env.example):

- `REDIS_URL` or Upstash vars (rate limit / quota)
- `FLAGS_SECRET` (flags SDK)
- `SVIX_SERVER_URL`, `SVIX_AUTH_TOKEN`, `SVIX_JWT_SECRET`, `SVIX_WEBHOOK_SECRET` (PRD §24.4 / Phase 11)

## Notes

- Keep audit + outbound webhook calls non-blocking where possible so user actions are not blocked by telemetry failures (handle errors in fire-and-forget paths).
- PRD file paths mentioning `(dashboard)` or `/organizations/[orgSlug]/audit-logs` without `settings/` are **superseded** by the slug-scoped settings tree above.

## Follow-up (optional)

- Deeper **integration** test for usage (real session cookie + test DB) under Phase 11 CI.
- Extend **precompute + resolver** pattern to other product flags when more than webhooks are read per request.
