# Phase 12 — Production hardening, onboarding polish, and deferred extras

**Status:** **planned** — specification for work after Phase 11; checkboxes below track execution (do not assume complete until marked).

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
| CSP | Report-only first (`Content-Security-Policy-Report-Only`), then enforcing — env-gated | Allowlist matrix for Stripe, PostHog, Better Auth, Payload `/admin` tradeoffs — [`docs/runbooks/csp-matrix.md`](../runbooks/csp-matrix.md) |
| Sentry | `@sentry/nextjs`, client/server/edge configs, `instrumentation.ts`, scrubbing / webhook hygiene | `SENTRY_*` / `NEXT_PUBLIC_SENTRY_*` in `.env.example`; optional tunnel route for ad blockers |
| Runbooks | Stripe, Svix, Redis/limits, PostHog + staging smoke | [`docs/runbooks/README.md`](../runbooks/README.md); README “Production operations” link |

**Checklist**

- [ ] Headers + HSTS policy documented per environment (no accidental HSTS on HTTP preview).
- [ ] CSP: report-only validated in staging → enforcing promoted when violations are understood (especially `/admin`).
- [ ] Sentry: DSN optional; PII scrubbing and webhook route exclusions verified per staging checklist.
- [ ] Runbooks kept in sync with `.env.example` key names (no secrets in docs).

---

## B — Deferred product extras (optional)

These items were called out earlier as **optional**; Phase 12 tracks them explicitly so they are not lost.

| Item | Goal | Notes |
|------|------|--------|
| **`GET/POST /api/invitations/accept`** (or equivalent HTTP surface) | Allow invitation acceptance via consistent API contract where UI/server actions are not enough | Align with existing invitation flows and auth cookies; document in README when added |
| **Full SAML IdP matrix smoke** | Confidence across common IdPs (Okta, Entra, generic SAML), not only happy-path E2E | Extend Playwright or integration coverage per [`phase-09-sso-saml.md`](phase-09-sso-saml.md) |
| **Deeper `proxy.ts` verification vs layout-only auth** | Ensure proxy/session/org guards match what layouts assume — no drift between middleware-style gate and RSC boundaries | Consider unit tests on extracted decision helpers + selective integration tests |

**Checklist**

- [ ] HTTP invitation accept route (if pursued): OpenAPI or README contract + tests.
- [ ] SAML: documented IdP matrix + automated smoke subset (optional nightly).
- [ ] Proxy vs layout: documented matrix of which routes use which guard; tests for regressions.

---

## C — Skeleton loaders

Outcome: every significant route shows a **loading UI that mirrors the final layout** (sidebar width, settings nav, tables, cards — not generic pulses).

**Scope (iterate until major surfaces covered)**

- [ ] Marketing/public routes (`/`, `/pricing`, `/features`, `/blog`, legal).
- [ ] Auth flows (`/sign-in`, `/sign-up`, account/settings).
- [ ] Org hub: dashboard, org settings subtabs (general, team, billing, webhooks, SSO, audit logs, usage, permissions).
- [ ] Payload admin entry if custom loading wrappers apply.

**Acceptance:** Side-by-side snapshot or quick video optional; minimally: structure (grid columns, nav regions) matches the loaded page component layout.

---

## D — Email templates

Outcome: transactional mail feels **intentional** — typography, spacing, brand placeholder, clear CTA — without locking to one brand.

- [ ] Audit templates under [`src/lib/email/templates`](../../src/lib/email/templates) (and related render paths).
- [ ] Shared layout partial (header/footer, primary button style, muted legal line).
- [ ] Dark-mode safe contrast; test in common clients (Gmail/Apple Mail) as feasible.
- [ ] README pointer: how to preview (`pnpm email:dev` or documented command).

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

- [ ] Feature list with rationale (not just feature names).
- [ ] Clear “start here” vs “advanced” sections.
- [ ] Cross-links to phase docs for deep dives.

---

## F — Marketing site

Outcome: public marketing reflects **this repo as a blank SaaS starter**, aligned with README — not a fictional product.

- [ ] Homepage hero and sections map to **actual capabilities** (tenant model, auth, billing readiness, webhooks, admin CMS, observability hooks).
- [ ] `/features` (or equivalent) mirrors README feature table where possible (single source of truth: prefer README driving copy or shared content module later).
- [ ] `/pricing` frames starter tiers as **examples** or “bring your own Stripe prices” so expectations stay honest.
- [ ] CTA points to docs/GitHub/sign-up consistent with starter positioning.

---

## Verification (phase exit)

- [ ] Staging smoke: marketing loads, sign-in, Stripe/portal paths compatible with CSP when enforcing.
- [ ] Payload `/admin` smoke after CSP tightening.
- [ ] Optional: forced server error with Sentry enabled shows scrubbed payload (if Sentry used).
- [ ] README + marketing reviewed together so **no contradictory claims**.

---

## Key paths (reference)

```
next.config.ts
src/lib/security/http-headers.ts
src/instrumentation.ts
sentry.client.config.ts
sentry.server.config.ts
sentry.edge.config.ts
docs/runbooks/
src/app/(frontend)/           # marketing + product shells
src/lib/email/templates/
README.md
```

---

## Phase reference index

Prior: [phase-11-docker-tests-readme.md](phase-11-docker-tests-readme.md). Return to [README.md](../../README.md) for repository overview; add Phase 12 to any master phase table when that index is next updated.
