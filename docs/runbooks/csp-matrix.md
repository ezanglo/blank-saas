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

| Area | Typical origins / keywords | Notes |
|------|---------------------------|--------|
| First-party | `'self'` | App HTML/API |
| Payload **`/admin`** | `'unsafe-inline'`, `'unsafe-eval'` (often required for bundled admin) | Payload constraint from Phase docs — expect violations until narrowed per subdomain split |
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

Strict CSP without `'unsafe-inline'` frequently breaks webpack-heavy admin SPAs. Acceptable patterns:

- Looser CSP **only** for `/admin` via route-split headers (future Next matcher tuning), or
- Host admin on a **subdomain** with its own policy (document blast radius).

The starter ships one global policy for simplicity — tighten deliberately.
