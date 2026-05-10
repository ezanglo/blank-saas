# Production operations — runbooks

These notes assume either:

1. **Vercel (or similar managed Node)** — TLS terminates at the platform; [`Strict-Transport-Security`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security) (`SECURITY_ENABLE_HSTS`) belongs **only** on canonical HTTPS hosts once previews/dev exclusion are understood. Prefer platform redirects/WAF and [`headers()` in `next.config.ts`](../../next.config.ts). CSP phases live under [`csp-matrix.md`](csp-matrix.md).
2. **Docker / VPS** — Same Next.js `headers()` apply on the Node process; additionally configure **reverse-proxy TLS**, upstream timeouts, and optional **mutual TLS** for sensitive inbound paths (for example operational Svix webhooks behind an edge gateway).

Hosted Postgres/Svix/Stripe remain unchanged across models; differences are **TLS termination**, **sticky routing**, and **where you attach HSTS / CSP reporting**.

## Index

| Topic | Doc |
|--------|-----|
| Stripe billing webhooks | [`stripe.md`](stripe.md) |
| Svix server + operational webhook | [`svix.md`](svix.md) |
| Redis / Upstash + API rate limits | [`redis-rate-limit.md`](redis-rate-limit.md) |
| PostHog client + incidents | [`posthog.md`](posthog.md) |
| CSP allowlist + rollout | [`csp-matrix.md`](csp-matrix.md) |
| Staging smoke checklist | [`staging-checklist.md`](staging-checklist.md) |
| Route guards (proxy vs layouts) | [`route-guards-matrix.md`](route-guards-matrix.md) |
| SAML IdP smoke matrix | [`saml-idp-matrix.md`](saml-idp-matrix.md) |

Secrets stay in `.env` / your secret manager — reference keys by name from [`.env.example`](../../.env.example); do not paste production values into docs.
