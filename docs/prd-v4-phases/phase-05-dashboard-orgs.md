# Phase 5 — Dashboard, orgs, members, invitations

Maps to **Phase 5** and PRD **§26** steps **12–16**, **§5**, **§7**, **§8**, **§9**.

## Purpose

Authenticated product shell and organization lifecycle: switching orgs, CRUD, invites, acceptance flow.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§5 Organization architecture](../../nextjs-multitenant-starter-PRD-v4.md) | Slugs, active org, switcher |
| [§7 RBAC matrix](../../nextjs-multitenant-starter-PRD-v4.md) | owner / admin / member |
| [§8 Server Actions catalog](../../nextjs-multitenant-starter-PRD-v4.md) | `organization`, `member`, `account` |
| [§9 Invitations](../../nextjs-multitenant-starter-PRD-v4.md) | Send, accept route, pending UI |
| [§10 Errors & loading](../../nextjs-multitenant-starter-PRD-v4.md) | Actions, 403, skeletons (partial) |

## Prerequisites

- Phases 1–4; Payload org mirror + better-auth org plugin.

## Deliverables (checklist)

- [ ] Dashboard layout: sidebar, header, **org switcher**, user nav (PRD §5.3, repo structure §3).
- [ ] Account: profile + security pages.
- [ ] Server actions: `src/lib/actions/organization.ts`, `member.ts`, `account.ts` per §8.
- [ ] Org list, create org (dual-write), `[orgSlug]` overview, settings, members table, invite dialog, **pending invitations** tab.
- [ ] `src/app/api/invitations/accept/route.ts` (PRD §9.2).
- [ ] RBAC enforcement on routes/actions per §7 (members cannot hit admin-only settings).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — RBAC matrix as pure functions if extracted from UI (`owner` / `admin` / `member`).
- **Integration** — server actions + [`invitations/accept`](../../src/app/api/) route with **test DB**; org slug + membership invariants vs [`proxy.ts`](../../src/proxy.ts) rules.

Checklist:

- [ ] Unit: role × capability matrix for settings routes §7.
- [ ] Integration: create org / invite / accept happy paths; member denied admin-only server actions §8.

## Key paths (expected)

```
src/app/(dashboard)/layout.tsx
src/components/layout/sidebar.tsx
src/components/layout/org-switcher.tsx
src/lib/actions/organization.ts
src/lib/actions/member.ts
src/lib/actions/account.ts
src/app/api/invitations/accept/route.ts
```

## Verification

- Create org → appears in switcher; slug rules §5.1.
- Invite → email (MailHog) → accept adds member §9.
- Role mismatch redirects or 403 per §10.3.

## Notes

- Stub `billing.ts` / `permissions.ts` only if needed; full implementations in Phases 7 and 10.
