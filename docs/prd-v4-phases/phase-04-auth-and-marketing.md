# Phase 4 — Auth and marketing UX

Maps to **Phase 4** and PRD **§26** steps **10–11**, **§19**, **§12**, **§21**.

## Purpose

Public and pre-dashboard experience: authentication forms and full marketing surface (MDX blog/changelog, SEO).

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§3 Routes](../../nextjs-multitenant-starter-PRD-v4.md) | `(frontend)/(auth)` + `(frontend)/(marketing)` |
| [§19 Forms pattern](../../nextjs-multitenant-starter-PRD-v4.md) | RHF + Zod + shadcn Form |
| [§21 Marketing pages](../../nextjs-multitenant-starter-PRD-v4.md) | Sections, MDX, legal |
| [§12 MDX frontmatter](../../nextjs-multitenant-starter-PRD-v4.md) | Blog + changelog |
| [§21.9 SEO](../../nextjs-multitenant-starter-PRD-v4.md) | `generateMetadata`, `next-sitemap` |

## Prerequisites

- Phases 1–3: auth API, email for password reset / magic link.

## Deliverables (checklist)

- [ ] Auth pages: `login`, `register`, `forgot-password`, `reset-password` + components under `src/components/auth/`.
- [ ] `(frontend)/(marketing)/layout.tsx` — nav + footer (PRD §21.2).
- [ ] Homepage sections + `framer-motion` (PRD §21.3); Features, Pricing (marketing), Blog index + `[slug]`, Changelog, Legal.
- [ ] Content: `/content/blog/*.mdx`, `/content/changelog/*.mdx` — seed posts per PRD.
- [ ] `next-mdx-remote` rendering with MDX component overrides (PRD §21.6).
- [ ] `postbuild`: `next-sitemap` (PRD §21.9, §25).

## Key paths (expected)

```
src/app/(auth)/login/page.tsx
src/app/(frontend)/(marketing)/page.tsx
src/components/marketing/
content/blog/
content/changelog/
```

## Verification

- All marketing routes render without session.
- Blog/changelog MDX matches frontmatter spec §12.
- Sitemap generates after `npm run build`.

## Notes

- Marketing pricing toggle is **display-only** until Stripe (Phase 7); align copy with `src/lib/quota/plans.ts` when that exists.
