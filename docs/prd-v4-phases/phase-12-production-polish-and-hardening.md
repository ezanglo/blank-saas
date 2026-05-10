# Phase 12 — Production hardening, onboarding polish, and deferred extras

**Status:** **implemented (code + docs)** — staging promotion of CSP/HSTS and final smoke tests remain **operator-run** (see [`docs/runbooks/staging-checklist.md`](../runbooks/staging-checklist.md)).

Maps cross-cutting **production readiness** (security headers, CSP rollout, Sentry, operator runbooks), **developer-facing onboarding** (README + marketing alignment), **UX polish** (skeletons, email templates), and **optional product/test debt** called out in earlier phases.

## Purpose

1. Make the repo **safe and observable** in production without forking deploy models (Vercel vs Docker/VPS) — operational detail lives in [`docs/runbooks/`](../runbooks/README.md).
2. Make the repo **easy to fork** for new SaaS products: README and marketing tell **what ships**, **why each block exists**, and **how to strip or extend it**.
3. Close visual gaps: **loading skeletons** mirror real layouts; **transactional email** looks credible out of the box.

This phase doc **does not replace** the standalone production-hardening checklist; it **anchors** that work in the phase roadmap alongside polish items.

## Relationship to Phase 11

Phase 11 owns Docker, CI, E2E/unit/integration conventions, and baseline README mechanics. Phase 12 adds:

- Hardening baseline (headers, phased CSP, optional Sentry, runbooks — see runbooks index).
- Narrative and presentation: README feature matrix, marketing site, skeletons, emails.

Testing conventions remain as in [phase-11-docker-tests-readme.md](phase-11-docker-tests-readme.md).

---

## A — Production hardening baseline

Outcome: conservative security headers, phased CSP, optional error monitoring, env-documented operator paths.

| Track | Deliverables | Notes |
|--------|----------------|-------|
| Headers | `next.config.ts` `headers()` composed with Payload + optional Sentry wrapper | Baseline: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, framing policy; **HSTS** only when explicitly enabled for real HTTPS hosts |
| CSP | Report-only first (`Content-Security-Policy-Report-Only`), then enforcing — env-gated | Allowlist matrix for Stripe, PostHog, Better Auth, Payload `/admin` tradeoffs — [`docs/runbooks/csp-matrix.md`](../runbooks/csp-matrix.md); **`/admin/:path*` CSP override** in [`src/lib/security/http-headers.ts`](../../src/lib/security/http-headers.ts) |
| Sentry | `@sentry/nextjs`, client/server/edge configs, `instrumentation.ts`, scrubbing / webhook hygiene | `SENTRY_*` / `NEXT_PUBLIC_SENTRY_*` in `.env.example`; optional tunnel route for ad blockers; unit tests in [`src/lib/sentry/options.test.ts`](../../src/lib/sentry/options.test.ts) |
| Runbooks | Stripe, Svix, Redis/limits, PostHog + staging smoke | [`docs/runbooks/README.md`](../runbooks/README.md); README “Production operations” link |

**Checklist**

- [x] Headers + HSTS policy documented per environment (no accidental HSTS on HTTP preview).
- [x] CSP: **code** — report-only + enforce env-gates, `/admin/:path*` override, [`csp-matrix.md`](../runbooks/csp-matrix.md) (operator still runs staging → enforce promotion).
- [ ] CSP: **staging** — report-only validated, violations triaged, enforcing promoted when ready (especially `/admin`) — [`staging-checklist.md`](../runbooks/staging-checklist.md).
- [x] Sentry: DSN optional; PII scrubbing and webhook route exclusions covered by tests + [`staging-checklist.md`](../runbooks/staging-checklist.md).
- [x] Runbooks kept in sync with `.env.example` key names (no secrets in docs).

---

## B — Deferred product extras (optional)

These items were called out earlier as **optional**; Phase 12 tracks them explicitly so they are not lost.

| Item | Goal | Notes |
|------|------|--------|
| **`GET/POST /api/invitations/accept`** (or equivalent HTTP surface) | Allow invitation acceptance via consistent API contract where UI/server actions are not enough | [`src/app/api/invitations/accept/route.ts`](../../src/app/api/invitations/accept/route.ts); [`tests/integration/invitations-accept-route.test.ts`](../../tests/integration/invitations-accept-route.test.ts); README |
| **Full SAML IdP matrix smoke** | Confidence across common IdPs (Okta, Entra, generic SAML), not only happy-path E2E | [`docs/runbooks/saml-idp-matrix.md`](../runbooks/saml-idp-matrix.md); automated nightly remains optional |
| **Deeper `proxy.ts` verification vs layout-only auth** | Ensure proxy/session/org guards match what layouts assume — no drift between middleware-style gate and RSC boundaries | [`docs/runbooks/route-guards-matrix.md`](../runbooks/route-guards-matrix.md); [`src/lib/proxy-guards.test.ts`](../../src/lib/proxy-guards.test.ts) |

**Checklist**

- [x] HTTP invitation accept route: README contract + integration tests.
- [x] SAML: documented IdP matrix + automated smoke subset (optional nightly).
- [x] Proxy vs layout: documented matrix of which routes use which guard; regression tests for pure helpers.

---

## C — Skeleton loaders

Outcome: every significant route shows a **loading UI that mirrors the final layout** (sidebar width, settings nav, tables, cards — not generic pulses).

**Scope (iterate until major surfaces covered)**

- [x] Marketing/public routes (`/`, `/pricing`, `/features`, `/blog`, `/contact`, changelog, legal) — segment `loading.tsx` files + shared skeleton components under `src/components/loading/`.
- [x] Auth flows (`/sign-in`, `/sign-up`, account/settings) — `(auth)/(guest)/loading.tsx`, `account/loading.tsx`.
- [x] Org hub: dashboard, org settings subtabs — `organizations/loading.tsx`, `[orgSlug]/loading.tsx`, `settings/loading.tsx`, `invite/.../loading.tsx`.
- [ ] Payload admin entry — do not hand-edit `(payload)` tree per [`AGENTS.md`](../../AGENTS.md); **not done** (optional; no `loading.tsx` added — follow Payload-supported patterns only).

**Acceptance:** Side-by-side snapshot or quick video optional; minimally: structure (grid columns, nav regions) matches the loaded page component layout.

---

## D — Email templates

Outcome: transactional mail feels **intentional** — typography, spacing, brand placeholder, clear CTA — without locking to one brand.

- [x] Audit templates under [`src/lib/email/templates`](../../src/lib/email/templates) (and related render paths).
- [x] Shared layout partial (header/footer, primary button style, muted legal line) — [`src/lib/email/transactional-layout.tsx`](../../src/lib/email/transactional-layout.tsx).
- [x] Dark-mode safe contrast; test in common clients (Gmail/Apple Mail) as feasible — high-contrast neutrals on white card.
- [x] README pointer — `pnpm email:dev` in Start here + Testing table.

---

## E — README (reuse-focused)

Outcome: another team can answer **“what do I get?”** and **“why is this here?”** in one pass.

Suggested structure (adapt to repo truth):

- **One paragraph**: what this boilerplate is (multi-tenant Next.js + Payload + Better Auth starter).
- **Feature table**: columns *Feature* | *Why included* | *Where to look / env*.
  - Examples to cover: orgs/members/invites, billing hooks + Stripe webhooks, quotas/rate limits, Svix webhooks, audit logs, SSO/SAML, granular permissions flag, PostHog, Payload CMS admin, S3 uploads, Docker dev stack, tests.
- **Fork path**: minimal steps to rename app, strip modules, and ship (link migrations, env layout).
- **Production operations**: link [`docs/runbooks/`](../runbooks/README.md).

**Checklist**

- [x] Feature list with rationale (not just feature names).
- [x] Clear “start here” vs “advanced” sections.
- [x] Cross-links to phase docs for deep dives.
- [x] **Deployment** — full Docker (`docker-compose.*`, ops you add) vs **Vercel + third-party accounts** (Postgres, Redis/Upstash, S3/SMTP, Stripe, Svix, etc.) in [`README.md`](../../README.md).

---

## F — Marketing site

Outcome: public marketing reflects **this repo as a blank SaaS starter**, aligned with README — not a fictional product.

- [x] Homepage hero and sections map to **actual capabilities** (tenant model, auth, billing readiness, webhooks, admin CMS, observability hooks).
- [x] `/features` mirrors README intent (pointer + expanded pillars); shared content module deferred.
- [x] `/pricing` frames starter tiers as **examples** / BYO Stripe prices.
- [x] CTA points sign-up / dashboard consistent with starter positioning.
- [x] **Contact** — `/contact` page, `POST /api/contact`, nav/footer links, homepage strip; `CONTACT_INBOX` / SMTP documented in [`.env.example`](../../.env.example).

---

## Verification (phase exit)

Run [`docs/runbooks/staging-checklist.md`](../runbooks/staging-checklist.md) before production CSP enforce + HSTS.

**Operator-run (not automated in this repo):**

- [ ] Staging smoke: marketing loads, sign-in, Stripe/portal paths compatible with CSP when enforcing.
- [ ] Payload `/admin` smoke after CSP tightening.
- [ ] Optional: forced server error with Sentry enabled shows scrubbed payload (if Sentry used).

**Done in-repo:**

- [x] README + marketing reviewed together so **no contradictory claims** (copy aligned in this pass).

---

## Key paths (reference)

```
next.config.ts
src/lib/security/http-headers.ts
src/instrumentation.ts
sentry.client.config.ts
sentry.server.config.ts
sentry.edge.config.ts
src/app/api/contact/route.ts
docs/runbooks/
src/app/(frontend)/           # marketing + product shells
src/lib/email/templates/
README.md
```

---

## Phase reference index

Prior: [phase-11-docker-tests-readme.md](phase-11-docker-tests-readme.md). Return to [README.md](../../README.md) for repository overview; phase index: [`docs/prd-v4-phases/README.md`](README.md).
