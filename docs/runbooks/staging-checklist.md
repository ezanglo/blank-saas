# Staging verification checklist

Run before promoting CSP/Sentry changes or infra upgrades.

## Marketing / public app

- [ ] Load primary marketing route (`/`) without console CSP violations when report-only or enforcing CSP is enabled.
- [ ] OAuth/sign-in callback completes (`/sign-in`, `/sign-up`) — watch **`connect-src`** if adding CSP.

## Authenticated product shell

- [ ] Protected dashboard renders after session refresh (`src/proxy.ts` guards).
- [ ] Organization routes resolve (`/organizations/[slug]/…`) including settings tabs touched recently.

## Payload CMS `/admin`

- [ ] Admin login loads scripts/styles — note CSP violations if enforcing strict policies.
- [ ] Media uploads still resolve against your S3-compatible endpoint (`img-src` / `connect-src`).

## Billing / Stripe

- [ ] Stripe Checkout or portal redirect leaves allowed origins (`form-action`, `frame-src`).
- [ ] Test webhook Round-trip (`stripe listen` → staging URL) returns **200**.

## Analytics / PostHog

- [ ] With `NEXT_PUBLIC_POSTHOG_KEY` set, events appear in PostHog live feed (no blocked ingest URLs).

## Sentry (when `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` configured)

- [ ] Trigger a benign server error (temporary throw route or forced **400**) — event lands with scrubbed query strings / headers (`beforeSend` in [`src/lib/sentry/options.ts`](../../src/lib/sentry/options.ts)).
- [ ] Confirm webhook routes `/api/webhooks/stripe` and `/api/webhooks/svix` remain excluded from heavy server instrumentation via [`next.config.ts`](../../next.config.ts) `excludeServerRoutes`.

## Headers sanity

- [ ] Response includes baseline headers (`X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) — inspect via curl or browser devtools.
- [ ] `Strict-Transport-Security` appears **only** when intentionally enabled (`SECURITY_ENABLE_HSTS=true`) on HTTPS.
