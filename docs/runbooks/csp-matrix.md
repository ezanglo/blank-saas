# Runbook — Content Security Policy (CSP)

## Implementation

Baseline directives are assembled in [`src/lib/security/http-headers.ts`](../../src/lib/security/http-headers.ts) and emitted via [`next.config.ts`](../../next.config.ts) `headers()`.

| Env | Effect |
|-----|--------|
| `SECURITY_CSP_REPORT_ONLY=true` | Sends **`Content-Security-Policy-Report-Only`** with the baseline policy (recommended first rollout step). |
| `SECURITY_CSP_ENFORCE=true` | Sends enforcing **`Content-Security-Policy`**. If both this and report-only are set, **enforcing wins** (report-only is omitted). |
| `SECURITY_ENABLE_HSTS=true` | Adds **`Strict-Transport-Security`**. Use **only** on canonical HTTPS production hosts (easy footgun on raw HTTP previews). |

## Allowlist matrix (conceptual)

Keep this table aligned with code when tightening directives.

`next.config.ts` applies **two** header sources (see [`src/lib/security/http-headers.ts`](../../src/lib/security/http-headers.ts)): `/:path*` first, then `/admin/:path*`. When a request matches both (Payload CMS under `/admin`), Next merges headers; **duplicate keys use the last matching block**, so the **`/admin` CSP** overrides the global **`Content-Security-Policy`** for admin routes. The admin variant adds **`blob:`** on `frame-src` (media/preview iframes) and **`'wasm-unsafe-eval'`** on `script-src` where the admin bundle needs it.

| Area | Typical origins / keywords | Notes |
|------|---------------------------|--------|
| First-party | `'self'` | App HTML/API |
| Payload **`/admin`** | `'unsafe-inline'`, `'unsafe-eval'`, **`wasm-unsafe-eval`**, **`blob:`** (`frame-src`) | Dedicated header block; still expect iteration if your Payload/plugins add third-party origins |
| Better Auth | `'self'` | `/api/auth/*` same-origin |
| Stripe Checkout / Elements | `https://js.stripe.com`, `https://hooks.stripe.com`, `https://api.stripe.com`, `https://*.stripe.network`, frames `checkout.stripe.com`, `billing.stripe.com`, … | Expand if Stripe adds new endpoints |
| PostHog | Origin from `NEXT_PUBLIC_POSTHOG_HOST` | EU/US clouds differ — set env explicitly |
| Sentry ingest | `https://*.ingest.sentry.io`, regional ingest hosts | Needed when tunnel route disabled |

## Rollout sequence

1. Enable **`SECURITY_CSP_REPORT_ONLY=true`** in staging; collect violations (browser console + CSP reporting endpoint if configured later).
2. Adjust directives in `contentSecurityPolicyDirectives()` until Payload marketing + auth + Stripe + PostHog flows are quiet.
3. Flip **`SECURITY_CSP_ENFORCE=true`** on staging, smoke Payload `/admin`, billing redirects, and PostHog.
4. Promote to production after checklist in [`staging-checklist.md`](staging-checklist.md).

### Payload `/admin` tradeoff

Strict CSP without `'unsafe-inline'` frequently breaks webpack-heavy admin SPAs. This repo uses a **dedicated `/admin/:path*` CSP override** (see Implementation above) so the marketing/product shell can stay on the default policy while Payload admin can include **`wasm-unsafe-eval`** and **`blob:`** `frame-src` where needed. A stricter long-term pattern is to host admin on a **subdomain** with its own policy (smaller blast radius).
