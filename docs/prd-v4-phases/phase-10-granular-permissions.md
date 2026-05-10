# Phase 10 — Granular permissions

Maps to **Phase 10** and PRD **§32**, **§8.5**, **§26** step **25**.

**Status:** implemented behind **`NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS`** — Payload [`permissions`](../../src/collections/Permissions.ts) collection, `checkPermission` / [`orgScopedAllows`](../../src/lib/permissions/org-access.ts) enforcement on org-scoped actions and settings UI ([AGENTS.md](../../AGENTS.md) for migration snapshots).

## Purpose

Resource-level ACL on top of RBAC: Payload `permissions` rows + `checkPermission()` + management UI.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§32 Granular permissions](../../nextjs-multitenant-starter-PRD-v4.md) | Collection, check helper, types, actions |
| [§32.8 Relationship to RBAC](../../nextjs-multitenant-starter-PRD-v4.md) | Evaluate RBAC first, then granular |
| [§8.5 actions/permissions](../../nextjs-multitenant-starter-PRD-v4.md) | `grantPermission`, `revokePermission`, `listPermissions` |

## Prerequisites

- Phase 2: `Permissions` collection deployed.
- Phase 5: org context and member list for UI.

## Deliverables (checklist)

- [x] [`src/collections/Permissions.ts`](../../src/collections/Permissions.ts) — fields + indexes §32.2 (registered from [`payload.config`](../../src/payload.config.ts); migrations under [`src/migrations/`](../../src/migrations/)).
- [x] [`src/lib/permissions/types.ts`](../../src/lib/permissions/types.ts) — `RESOURCE_ACTIONS` §32.4 (includes **`org_*`** presets for org-wide delegation).
- [x] [`src/lib/permissions/check.ts`](../../src/lib/permissions/check.ts) — `checkPermission()`, `permissionCheckWhere()`, `resolveResourceAccess()` §32.3 / §32.8.
- [x] [`src/lib/permissions/org-access.ts`](../../src/lib/permissions/org-access.ts) — `orgScopedAllows` / `assertOrgScopedAccess` wiring RBAC-first then granular for product surfaces.
- [x] [`src/lib/actions/permissions.ts`](../../src/lib/actions/permissions.ts) §32.5 + §8.5 (`grant`/`revoke` owner-only when feature enabled).
- [x] [`GET /api/orgs/[orgId]/permissions`](../../src/app/api/orgs/[orgId]/permissions/route.ts) — list API with admin / delegated `org_permissions:read`.
- [x] **`/organizations/[orgSlug]/settings/permissions`** — [`page.tsx`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/permissions/page.tsx), [`OrgPermissionsView`](../../src/components/permissions/org-permissions-view.tsx), [`GrantPermissionDialog`](../../src/components/permissions/grant-permission-dialog.tsx) §32.6.
- [x] **§32.7 usage pattern** — see **Notes** below and [`AGENTS.md`](../../AGENTS.md) (`migrate:create` vs snapshots).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — [`check.test.ts`](../../src/lib/permissions/check.test.ts); [`org-access.test.ts`](../../src/lib/permissions/org-access.test.ts); [`validate-actions.test.ts`](../../src/lib/permissions/validate-actions.test.ts).
- **Integration** — [`tests/integration/permissions-actions.test.ts`](../../tests/integration/permissions-actions.test.ts).

Checklist:

- [x] Unit: RBAC short-circuit vs granular when RBAC denies — [`check.test.ts`](../../src/lib/permissions/check.test.ts) (`resolveResourceAccess`) §32.8.
- [x] Integration: grant/revoke/list round-trip (mocked Payload + auth) — [`permissions-actions.test.ts`](../../tests/integration/permissions-actions.test.ts).

## Key paths (expected)

```
src/collections/Permissions.ts
src/lib/permissions/check.ts
src/lib/permissions/org-access.ts
src/lib/permissions/types.ts
src/lib/permissions/list.ts
src/lib/actions/permissions.ts
src/app/api/orgs/[orgId]/permissions/route.ts
src/components/permissions/
```

## Verification

- Feature **off:** no permissions UI/API; RBAC-only ([`feature.ts`](../../src/lib/permissions/feature.ts)).
- Feature **on:** E2E [`tests/e2e/permissions.spec.ts`](../../tests/e2e/permissions.spec.ts); owners grant/revoke; admins (or `org_permissions:read`) can view; delegated **`org_*`** grants enforced on settings/actions ([`org-access.ts`](../../src/lib/permissions/org-access.ts)).

## Notes

- **Do not** introduce Permit.io — PRD Section 2 table is outdated; §32 is canonical.
- **Grant presets:** use organization id or **`*`** as `resourceId` for org-wide rows; known types include `org_team`, `org_webhooks`, `org_settings`, `org_audit_logs`, `org_billing`, `org_sso`, `org_permissions` (see [`RESOURCE_ACTIONS`](../../src/lib/permissions/types.ts)). Opt-in via **`NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS=true`** (build-time for client bundles).
