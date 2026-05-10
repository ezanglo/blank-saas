# Phase 4 — Auth and marketing UX

Maps to **Phase 4** and PRD **§26** steps **10–11**, **§19**, **§12**, **§21**.

## Purpose

Public and pre-dashboard experience: authentication forms and full marketing surface (MDX blog/changelog, SEO).

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§3 Routes](../../nextjs-multitenant-starter-PRD-v4.md) | `(frontend)/(auth)/(guest)` (sign-in/up/recovery) + `(frontend)/(marketing)`; `(auth)`-only for **`/sign-out`** |
| [§19 Forms pattern](../../nextjs-multitenant-starter-PRD-v4.md) | RHF + Zod + shadcn Form |
| [§21 Marketing pages](../../nextjs-multitenant-starter-PRD-v4.md) | Sections, MDX, legal |
| [§12 MDX frontmatter](../../nextjs-multitenant-starter-PRD-v4.md) | Blog + changelog |
| [§21.9 SEO](../../nextjs-multitenant-starter-PRD-v4.md) | `generateMetadata`, `next-sitemap` |

## Prerequisites

- Phases 1–3: auth API, email for password reset / magic link.

## Deliverables (checklist)

- [x] Auth pages: **`/sign-in`**, **`/sign-up`**, **`/forgot-password`**, **`/reset-password`** (under **`(frontend)/(auth)/(guest)`**) + **`/sign-out`** under **`(auth)`** only + components under `src/components/auth/`.
- [x] `(frontend)/(marketing)/layout.tsx` — nav + footer (PRD §21.2).
- [x] Homepage sections + `framer-motion` (PRD §21.3); Features, Pricing (marketing), Blog index + `[slug]`, Changelog, Legal.
- [x] Content: `/content/blog/*.mdx`, `/content/changelog/*.mdx` — seed posts per PRD.
- [x] `next-mdx-remote` rendering with MDX component overrides (PRD §21.6).
- [x] `postbuild`: `next-sitemap` (PRD §21.9, §25).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — Zod schemas for auth forms (`sign-in`, `sign-up`, reset); helpers parsing MDX/frontmatter §12.
- **Integration** — marketing routes return **200** and critical metadata where asserted; optional Playwright smoke deferred to Phase 11 E2E.

Checklist:

- [x] Unit: validation schemas match PRD §19 (password rules, email shape); MDX/frontmatter helpers — `src/lib/auth/schemas.test.ts`, `src/lib/mdx/schemas.test.ts`, `src/lib/mdx/format.test.ts`.
- [x] E2E smoke: homepage + blog + pricing + changelog + legal — [`tests/e2e/marketing.spec.ts`](../../tests/e2e/marketing.spec.ts) (PRD §23.2).

## Key paths (actual)

```
src/app/(frontend)/(auth)/(guest)/layout.tsx        # redirects signed-in → /dashboard
src/app/(frontend)/(auth)/(guest)/sign-in/page.tsx
src/app/(frontend)/(auth)/(guest)/sign-up/page.tsx
src/app/(frontend)/(auth)/(guest)/forgot-password/
src/app/(frontend)/(auth)/(guest)/reset-password/
src/app/(frontend)/(auth)/sign-out/page.tsx
src/components/auth/
src/lib/query/hooks.ts                                # session + refreshClientSessionCache
src/components/marketing/marketing-auth-ctas.tsx     # nav/hero Dashboard when signed in
src/app/(frontend)/(marketing)/page.tsx
src/components/marketing/
src/lib/mdx/
content/blog/
content/changelog/
next-sitemap.config.cjs
```

## Verification

- All marketing routes render without session.
- After **email** sign-in without `callbackUrl`, user lands on **`/dashboard`** (alias → workspace home in Phase 5); marketing CTAs show **Dashboard** without a full reload (session query + `refreshClientSessionCache` after sign-in).
- Blog/changelog MDX matches frontmatter spec §12.
- Sitemap generates after `npm run build`.

## Notes

- Marketing pricing toggle is **display-only** until Stripe (Phase 7); align copy with `src/lib/quota/plans.ts` when that exists.
- **Guest auth layout** — [`(guest)/layout.tsx`](../../src/app/(frontend)/(auth)/(guest)/layout.tsx) prevents signed-in users from staying on sign-in/up/recovery screens (redirect to app entry).
