# Phase 8 — PostHog analytics

Maps to **Phase 8** and PRD **§30**, **§26** step **23**.

## Purpose

Product analytics: client + server capture, identity and group analytics for orgs, session replay hygiene.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§30 Analytics — PostHog](../../nextjs-multitenant-starter-PRD-v4.md) | Provider, server client, event table |
| [§30.5 Instrumented events](../../nextjs-multitenant-starter-PRD-v4.md) | org/member/billing/quota/flags/sso |
| [§30.6 Identify + Group](../../nextjs-multitenant-starter-PRD-v4.md) | User + `company` group |

## Prerequisites

- Phases 5–7 (for meaningful events); Phase 9 for `sso_login` event.

## Deliverables (checklist)

- [x] [`src/lib/analytics/client.tsx`](../../src/lib/analytics/client.tsx) — `PostHogProvider`, `PostHogPageView`, init options §30.3 (wired from [`providers.tsx`](../../src/components/providers.tsx)).
- [x] **Custom `$pageview`** — pathname-driven capture via [`PostHogPageView`](../../src/lib/analytics/client.tsx) (`capture_pageview: false` + explicit [`PAGEVIEW`](../../src/lib/analytics/events.ts)).
- [x] [`src/lib/analytics/server.ts`](../../src/lib/analytics/server.ts) — `posthog-node` singleton §30.4; [`shutdownAnalytics`](../../src/lib/analytics/server.ts) for tests/teardown.
- [x] [`src/hooks/use-analytics.ts`](../../src/hooks/use-analytics.ts) §30.8 (`OrgSwitcher` group analytics).
- [x] Core §30.5 instrumentation — server [`captureServerEvent`](../../src/lib/analytics/server.ts) from [`organization`](../../src/lib/actions/organization.ts), [`member`](../../src/lib/actions/member.ts), [`billing/process-webhook`](../../src/lib/billing/process-webhook.tsx), [`quota/check`](../../src/lib/quota/check.ts), [`flags/adapter`](../../src/lib/flags/adapter.ts), SSO [`post-login`](../../src/lib/sso/post-login.ts); names in [`events.ts`](../../src/lib/analytics/events.ts).
- [x] **Identify + group** — [`PostHogIdentify`](../../src/lib/analytics/client.tsx) in protected [`layout.tsx`](../../src/app/(frontend)/(protected)/layout.tsx); **`company`** group via [`posthog-workspace-group.tsx`](../../src/components/analytics/posthog-workspace-group.tsx) / [`org-switcher.tsx`](../../src/components/layout/org-switcher.tsx) §30.6.
- [x] **`ph-no-capture`** on password / sensitive auth inputs ([sign-in/up](../../src/components/auth/), [account](../../src/app/(frontend)/(protected)/account/page.tsx), admin auth stubs).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — event name constants and payload shapes §30.5 (avoid typos in `$pageview` / custom events).
- **Integration** — server analytics module (`src/lib/analytics/server.ts` per §30.4) with **mocked `posthog-node`** (`shutdown()` in teardown).

Checklist:

- [x] Unit: event constants — [`events.test.ts`](../../src/lib/analytics/events.test.ts).
- [x] Unit: server capture no-op / shutdown — [`server.test.ts`](../../src/lib/analytics/server.test.ts).

## Key paths (expected)

```
src/lib/analytics/client.tsx
src/lib/analytics/server.ts
src/hooks/use-analytics.ts
```

## Verification

- Events appear in PostHog (self-hosted compose or cloud) for key flows.
- No card data captured (Checkout is off-site §30.7).

## Env vars

- `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, optional `POSTHOG_PERSONAL_API_KEY` §24.4

## Notes

- Align `distinctId` with `user.id` from better-auth for consistent funnels.
