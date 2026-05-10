# Runbook — Route guards (proxy vs layouts)

## Summary

| Layer | Responsibility | Code |
|-------|----------------|------|
| **Edge / Node proxy** | Session gate for product paths; API rate limits; org slug membership checks before the route renders | [`src/proxy.ts`](../../src/proxy.ts), [`src/lib/proxy-guards.ts`](../../src/lib/proxy-guards.ts) |
| **Protected React layout** | Confirms session again; wraps dashboard shell (sidebar, headers) | [`src/app/(frontend)/(protected)/layout.tsx`](../../src/app/(frontend)/(protected)/layout.tsx) |
| **Organization slug layout** | Org exists + user is a member (role-based redirects) | [`src/app/(frontend)/(protected)/organizations/[orgSlug]/layout.tsx`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/layout.tsx) |
| **Org settings layout** | Permission-aware nav (RBAC + optional granular flags) | [`src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/layout.tsx`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/layout.tsx) |
| **Server actions / API routes** | Final authorization for mutations and privileged reads | Route handlers under `src/app/api/**`, actions in `src/lib/actions/**` |

## Path classification (proxy)

Pure helpers in `proxy-guards` (unit-tested in [`src/lib/proxy-guards.test.ts`](../../src/lib/proxy-guards.test.ts)):

- **Protected product paths** (session required): `/dashboard`, `/organizations`, `/account`, `/invite`
- **Everything else** (marketing, `/sign-in`, `/api/auth`, static assets, etc.) skips the session redirect in the proxy unless further rules are added

When changing [`isProtectedProductPath`](../../src/lib/proxy-guards.ts), update the test file and this matrix.

## Drift checklist

- [ ] New authenticated segment under `(protected)` should match proxy rules or users may reach the layout without passing the proxy (unlikely if using same URL prefix).
- [ ] New admin-only API routes should use explicit session + role checks, not assume the proxy ran.
