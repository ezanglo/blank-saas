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

- [ ] `src/lib/analytics/client.tsx` — `PostHogProvider`, init options §30.3.
- [ ] `PostHogPageView` — `$pageview` on pathname change §30.3.
- [ ] `src/lib/analytics/server.ts` — `posthog-node` singleton §30.4; **shutdown** in tests §30.4.
- [ ] `src/hooks/use-analytics.ts` §30.8.
- [ ] Instrument rows from §30.5 at indicated call sites (org create/delete, invite, Stripe webhooks, quota denial, flag adapter, SAML callback).
- [ ] After login: `identify`; after org switch: `group("company", orgId, …)` §30.6.
- [ ] Add `ph-no-capture` on sensitive inputs §30.7.

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — event name constants and payload shapes §30.5 (avoid typos in `$pageview` / custom events).
- **Integration** — server analytics module (`src/lib/analytics/server.ts` per §30.4) with **mocked `posthog-node`** (`shutdown()` in teardown).

Checklist:

- [ ] Unit: exported event names match §30.5 table.
- [ ] Integration: capture helpers no-op when keys unset (dev).

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
