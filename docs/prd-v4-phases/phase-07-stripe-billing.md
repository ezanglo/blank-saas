# Phase 7 — Stripe billing

Maps to **Phase 7** and PRD **§29** (Billing), **§8.4**, **§26** step **22**.

**Status:** Core Phase 7 deliverables are implemented; checklist below reflects the repo as of the billing UX and schedule work (upgrade vs downgrade behavior, marketing prices, change-plan dialog).

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

### Core (PRD §29 / §8.4)

- [x] `src/lib/billing/stripe.ts` — SDK singleton (Stripe `apiVersion` from SDK; placeholder key when secret missing for build).
- [x] `src/lib/billing/plans.ts` — `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY` env mapping (PRD §29.3 style); `planFromPriceId`, `listAllowedPriceIds`.
- [x] Server actions: `src/lib/actions/billing.ts` — checkout (`createCheckoutSessionAction`), portal (`createPortalSessionAction`), cancel at period end, resume subscription, RBAC (owner vs admin).
- [x] `src/lib/billing/portal.ts` — Customer Portal session URL (return URL to org billing settings).
- [x] `src/app/api/webhooks/stripe/route.ts` — signature verify + idempotent event storage §29.6.
- [x] `src/lib/billing/process-webhook.tsx` — event dispatch, org patches, audit + Svix + billing emails.
- [x] `src/app/api/billing/portal/route.ts` — session gate + redirect to portal §29.5.
- [x] UI: `src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/billing/page.tsx` + `src/components/billing/org-billing-settings.tsx` — plan, payment, invoices, cancel/resume, Stripe portal links §29.7.
- [x] UI: `src/components/billing/upgrade-dialog.tsx` — change plan: Free, Monthly/Yearly tabs, Pro + Enterprise (yearly Enterprise N/A), upgrade vs downgrade messaging.
- [x] Email: `src/lib/email/templates/billing-alert.tsx` + send from webhook paths §29.8.
- [x] Fire audit events + outbound Svix where wired (`billing.subscription_activated`, `billing.plan_changed`, `billing.subscription_cancelled`, `billing.checkout_started`, `billing.subscription_resumed`).

### Supporting modules (implemented)

- [x] `src/lib/billing/webhook-handlers.ts` — subscription → org patch (plan, `stripeSubscriptionId`, status, `stripePriceId`).
- [x] `src/lib/billing/stripe-idempotency.ts` + `StripeProcessedEvents` collection — duplicate `event.id` no-op §29.6.
- [x] `src/lib/billing/list-invoices.ts` — list invoices for customer; billing UI table.
- [x] `src/lib/billing/format-stripe-price.ts` / `plan-display.ts` — price + plan copy.
- [x] `src/lib/billing/subscription-period.ts` — period end/start helpers (line-item fields).
- [x] `src/lib/billing/price-change.ts` — catalog order, upgrade vs downgrade vs Free sentinel for UI labels.
- [x] `src/lib/billing/subscription-schedule.ts` — **downgrades** scheduled via Subscription Schedules to **end of current period**; **releases** schedule before **immediate upgrades**.
- [x] `src/lib/billing/marketing-prices.ts` — `/pricing` + home pricing preview read same Stripe Prices as checkout (fallbacks if env/Stripe unavailable).

### Product behavior (current)

| Action | Behavior |
|--------|----------|
| **Upgrade** (higher catalog tier / interval) | Immediate `subscriptions.update` with proration; any existing subscription **schedule** is **released** first. |
| **Downgrade** (lower paid price) | **Subscription schedule**: current price until `current_period_end`, then new price; org record updates on webhook when the phase applies. |
| **Free** in change-plan dialog | Same as cancel: `cancel_at_period_end` (access until period end). |
| **New paid** (no usable subscription) | Stripe Checkout (new tab). |
| **Duplicate subscription guard** | Existing subscription uses update/schedule path, not a second Checkout subscription. |

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — price env / `planFromPriceId`; pure webhook → org patch helpers §29.6; price-tier / upgrade vs downgrade classification.
- **Integration** — `POST /api/webhooks/stripe` with **`stripe-signature`** (generated test header).

Checklist:

- [x] Unit: `src/lib/billing/plans.test.ts` — price env / mapping behavior.
- [x] Unit: `src/lib/billing/webhook-handlers.test.ts` — event → patch shapes.
- [x] Unit: `src/lib/billing/stripe-idempotency.test.ts` — idempotency helper constraints.
- [x] Unit: `src/lib/billing/price-change.test.ts` — tier / Free sentinel.
- [x] Integration: `src/app/api/webhooks/stripe/route.test.ts` — signature + handler invocation (mocked processor).

## Key paths (reference)

```
src/lib/billing/stripe.ts
src/lib/billing/plans.ts
src/lib/billing/portal.ts
src/lib/billing/process-webhook.tsx
src/lib/billing/webhook-handlers.ts
src/lib/billing/stripe-idempotency.ts
src/lib/billing/list-invoices.ts
src/lib/billing/format-stripe-price.ts
src/lib/billing/plan-display.ts
src/lib/billing/subscription-period.ts
src/lib/billing/price-change.ts
src/lib/billing/subscription-schedule.ts
src/lib/billing/marketing-prices.ts
src/lib/actions/billing.ts
src/app/api/webhooks/stripe/route.ts
src/app/api/billing/portal/route.ts
src/components/billing/org-billing-settings.tsx
src/components/billing/upgrade-dialog.tsx
src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/billing/page.tsx
src/app/(frontend)/(marketing)/pricing/page.tsx
src/lib/email/templates/billing-alert.tsx
```

## Verification

- Test mode: Checkout or in-place upgrade updates org after webhooks; downgrade schedule applies lower price after period boundary (check Stripe Dashboard + `customer.subscription.updated`).
- `checkQuota()` / plan limits follow org `plan` from Payload §29.9.
- Marketing `/` and `/pricing` show live amounts when `STRIPE_SECRET_KEY` + price IDs are set.

## Env vars

- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, publishable key (client if used), `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_YEARLY`, `STRIPE_PRICE_ENTERPRISE_MONTHLY` (see `.env.example` §24.4 style).

## Notes

- Local dev: `stripe listen` forwarding to `/api/webhooks/stripe` (README §27).
- Subscription **schedules** require correct phase boundaries; if Stripe returns an error on schedule update, confirm subscription state in Dashboard (test mode).
