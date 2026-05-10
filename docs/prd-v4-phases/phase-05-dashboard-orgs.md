# Phase 5 — Dashboard, orgs, members, invitations

**Status:** deliverables implemented in this repo; **E2E** covers org lifecycle ([`tests/e2e/`](../../tests/e2e/)); optional **Vitest + Payload harness** remains incremental ([phase-11](phase-11-docker-tests-readme.md)).

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

- [x] **Product shell**: [`src/app/(frontend)/(protected)/layout.tsx`](../../src/app/(frontend)/(protected)/layout.tsx) — session gate → [`DashboardShell`](../../src/components/layout/dashboard-shell.tsx) with [`AppSidebar`](../../src/components/app-sidebar.tsx), header, [`TeamSwitcher`](../../src/components/team-switcher.tsx) (workspace / org picker), [`NavUser`](../../src/components/nav-user.tsx). **Note:** Sidebar primary item is labeled **Dashboard** and routes to the active workspace home (`/organizations/[orgSlug]` when an org is active).
- [x] **Account**: [`/account`](../../src/app/(frontend)/(protected)/account/page.tsx) — profile + security (password) on one page; app [`/settings`](../../src/app/(frontend)/(protected)/settings/page.tsx) redirects to `/account`.
- [x] **Server actions**: [`src/lib/actions/organization.ts`](../../src/lib/actions/organization.ts), [`member.ts`](../../src/lib/actions/member.ts), [`account.ts`](../../src/lib/actions/account.ts), plus [`invitations.ts`](../../src/lib/actions/invitations.ts) (`acceptInvitationAction` / `rejectInvitationAction`) per §8 patterns.
- [x] **Org UX**: org list + create org, `[orgSlug]` overview, **org settings**, **Team** view (members + invitations with tabs via [`OrgTeamContent`](../../src/components/org/org-team-content.tsx)). Legacy URLs [`/organizations/[orgSlug]/members`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/members/page.tsx) and [`/invitations`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/invitations/page.tsx) redirect to **`/team`** / **`/team?tab=invites`**.
- [x] **Invitation accept (§9):** UX at [`/invite/[invitationId]`](../../src/app/(frontend)/(protected)/invite/[invitationId]/page.tsx) with [`invite-accept-client.tsx`](../../src/app/(frontend)/(protected)/invite/invite-accept-client.tsx) — loads invitation via Better Auth HTTP API and accepts via **`acceptInvitationAction`** (not a separate App Router **`/api/invitations/accept`** file). *Add that route later only if you need a webhook-only or non-Server-Action HTTP entrypoint.*
- [x] **RBAC** on routes / actions aligned with §7 (e.g. `canManageMembers` / `requireOrg` patterns); helpers in [`src/lib/auth/rbac.ts`](../../src/lib/auth/rbac.ts).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — RBAC matrix pure functions [`src/lib/auth/rbac.test.ts`](../../src/lib/auth/rbac.test.ts).
- **Integration** — server actions + invitation accept flows with **test DB** vs org slug / membership rules (defer to Phase 11 compose harness).

Checklist:

- [x] Unit: role × capability matrix §7 — [`rbac.test.ts`](../../src/lib/auth/rbac.test.ts).
- [x] E2E: create org / invite / accept / member flows — [`tests/e2e/organizations.spec.ts`](../../tests/e2e/organizations.spec.ts), [`invitations.spec.ts`](../../tests/e2e/invitations.spec.ts), [`members.spec.ts`](../../tests/e2e/members.spec.ts). Optional Vitest+Payload harness for the same flows remains incremental ([phase-11](phase-11-docker-tests-readme.md)).

## Key paths (actual)

```
src/app/(frontend)/(protected)/layout.tsx
src/app/(frontend)/(protected)/dashboard/page.tsx    # redirects to workspace home
src/app/(frontend)/(protected)/organizations/**      # picker, [orgSlug] overview/settings/team
src/app/(frontend)/(protected)/invite/[invitationId]/page.tsx
src/components/layout/dashboard-shell.tsx
src/components/app-sidebar.tsx
src/components/team-switcher.tsx
src/lib/actions/organization.ts
src/lib/actions/member.ts
src/lib/actions/account.ts
src/lib/actions/invitations.ts
src/lib/auth/rbac.ts
```

## Verification

- Create org → appears in **TeamSwitcher**; slug behavior per §5.1 / dual-write paths in org actions.
- Invite → email (MailHog) → open accept link → `/invite/...` adds member §9; client invalidates session / org query keys after accept.
- Role mismatch: redirect or actionable error per §10 (Org settings / team actions guarded by role).
- `/dashboard` (post–sign-in default) resolves to workspace home or `/organizations` when no active org — see [`dashboard/page.tsx`](../../src/app/(frontend)/(protected)/dashboard/page.tsx).

## Gaps / follow-ups

- **`src/app/api/invitations/accept/route.ts`** — not present; parity with §9 “HTTP route” wording is satisfied by **invite page + Server Action + Better Auth `acceptInvitation`**. Add a thin API route only if something external must POST accept without Next’s action protocol.
- **Product gating vs `proxy.ts`** — authenticated pages enforce session in **`(protected)/layout.tsx`**. [`src/proxy.ts`](../../src/proxy.ts) still tracks PRD §4.4-style ordering for when global request interception is turned on at the Next config edge; verify platform wiring separately from Phase 5 UI.
- **OAuth / magic link** — after sign-in, ensure client session cache stays fresh (email sign-in uses [`refreshClientSessionCache`](../../src/lib/query/hooks.ts)); extend the same pattern on other auth completion paths if you see stale marketing/app chrome.

## Notes

- **`billing.ts`** lives under Phase 7; granular permissions narrative is **[phase-10](phase-10-granular-permissions.md)** (feature-flagged).
- Marketing **Dashboard** CTA when signed in: [`marketing-auth-ctas.tsx`](../../src/components/marketing/marketing-auth-ctas.tsx) + TanStack session query; stale cache mitigated via refresh after email sign-in (Phase 4 / query hooks).
