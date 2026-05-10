# PRD v4 — phase reference docs

Companion references for building [nextjs-multitenant-starter-PRD-v4.md](../../nextjs-multitenant-starter-PRD-v4.md) on this repo. Follow **PRD Section 26 — Build Order** as the master sequence; these files expand each phase with links, paths, and “done” checks.

## Index

| Phase | Doc | Focus |
|-------|-----|--------|
| 1 | [phase-01-scaffold-and-design-system.md](phase-01-scaffold-and-design-system.md) | Layout, deps, shadcn, Tailwind, `next.config` |
| 2 | [phase-02-database-payload-auth.md](phase-02-database-payload-auth.md) | Drizzle, Payload collections, better-auth, migrations, org mirror *(blank-saas doc: **complete**)* |
| 3 | [phase-03-middleware-email-query.md](phase-03-middleware-email-query.md) | Middleware, email, TanStack Query |
| 4 | [phase-04-auth-and-marketing.md](phase-04-auth-and-marketing.md) | Auth pages, marketing, MDX, sitemap |
| 5 | [phase-05-dashboard-orgs.md](phase-05-dashboard-orgs.md) | Dashboard shell, orgs, members, invitations |
| 6 | [phase-06-audit-flags-quotas-webhooks.md](phase-06-audit-flags-quotas-webhooks.md) | Audit logs, flags, quotas, Svix |
| 7 | [phase-07-stripe-billing.md](phase-07-stripe-billing.md) | Stripe checkout, webhooks, billing UI |
| 8 | [phase-08-posthog.md](phase-08-posthog.md) | PostHog client/server, events |
| 9 | [phase-09-sso-saml.md](phase-09-sso-saml.md) | Jackson, SAML plugin, SSO settings |
| 10 | [phase-10-granular-permissions.md](phase-10-granular-permissions.md) | Payload Permissions, `checkPermission()` |
| 11 | [phase-11-docker-tests-readme.md](phase-11-docker-tests-readme.md) | Docker, Playwright, README, `.env.example` |

## Clarifications (carry through all phases)

- **Granular auth:** Implement **PRD Section 32** (Payload-backed permissions). The Section 2 table row mentioning Permit.io is outdated.
- **PRD Section 17.1:** “Permissions — See Section 29.3” is a typo → use **Section 32**.
- **Next.js:** This repo targets Next 16. Check in-repo Next docs under `node_modules/next/dist/docs/` and Payload’s Next integration for the exact middleware/API route patterns.

## Canonical env reference

See PRD **Section 24.4** and [phase-11-docker-tests-readme.md](phase-11-docker-tests-readme.md) for the full `.env.example` story.
