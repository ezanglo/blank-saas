# Phase 7 — Stripe billing

Maps to **Phase 7** and PRD **§29** (Billing), **§8.4**, **§26** step **22**.

## Purpose

Subscription billing: Checkout, Customer Portal, webhooks syncing org `plan` and Stripe fields on Payload `Organizations`.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§29 Billing — Stripe](../../nextjs-multitenant-starter-PRD-v4.md) | Client, prices map, checkout, portal, webhooks |
| [§29.6 Webhook events](../../nextjs-multitenant-starter-PRD-v4.md) | Event → org field updates |
| [§29.7 Billing dashboard](../../nextjs-multitenant-starter-PRD-v4.md) | Org settings billing tab |
| [§29.9 Quota sync](../../nextjs-multitenant-starter-PRD-v4.md) | Plan from org record |

## Prerequisites

- Phase 5–6: org record with Stripe fields §17.1; audit + `sendWebhook()` to instrument billing events.

## Deliverables (checklist)

- [ ] `src/lib/billing/stripe.ts` — SDK singleton (use current Stripe `apiVersion`, not necessarily PRD snippet).
- [ ] `src/lib/billing/plans.ts` — `STRIPE_PRICES` env mapping §29.3.
- [ ] Server actions: `createCheckoutSession`, portal session helper §29.4–29.5.
- [ ] `src/app/api/webhooks/stripe/route.ts` — signature verify + table §29.6.
- [ ] `src/app/api/billing/portal/route.ts` — redirect to portal §29.5.
- [ ] UI: `/organizations/[orgSlug]/settings/billing` (or path in PRD §29.7), `UpgradeDialog`, portal button §29.7.
- [ ] Email: `billing-alert.tsx` + send from webhook paths §29.8.
- [ ] `src/lib/actions/billing.ts` per §8.4.
- [ ] Fire audit events + outbound Svix per §29 (e.g. `billing.subscription_activated`).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — `STRIPE_PRICES` → internal plan key mapping; **pure** table mapping Stripe webhook event types → org field patch objects §29.6.
- **Integration** — `POST /api/webhooks/stripe` with **Stripe CLI** or fixture payloads + **`stripe-signature`** (test secret).

Checklist:

- [ ] Unit: price env parsing fails loudly when missing required keys.
- [ ] Integration: idempotent webhook handling (duplicate `event.id`) §29.6.

## Key paths (expected)

```
src/lib/billing/stripe.ts
src/lib/billing/plans.ts
src/lib/billing/portal.ts
src/lib/actions/billing.ts
src/app/api/webhooks/stripe/route.ts
src/app/api/billing/portal/route.ts
src/components/billing/
```

## Verification

- Test mode checkout updates org after webhook (PRD §23.2 `billing.spec.ts` scenarios).
- `checkQuota()` reflects upgraded plan without extra coupling §29.9.

## Env vars

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable keys, `STRIPE_PRICE_*` (PRD §24.4)

## Notes

- Local dev: `stripe listen` forwarding to `/api/webhooks/stripe` (README §27).
