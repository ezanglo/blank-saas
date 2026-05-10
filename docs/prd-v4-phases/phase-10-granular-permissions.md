# Phase 10 — Granular permissions

Maps to **Phase 10** and PRD **§32**, **§8.5**, **§26** step **25**.

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

- [ ] `src/payload/collections/Permissions.ts` — fields + indexes §32.2.
- [ ] `src/lib/permissions/types.ts` — `RESOURCE_ACTIONS` §32.4.
- [ ] `src/lib/permissions/check.ts` — `checkPermission()` with valid Payload `where` §32.3 (PRD snippet is illustrative).
- [ ] `src/lib/actions/permissions.ts` §32.5 + §8.5.
- [ ] `/organizations/[orgSlug]/permissions` — table, filters, `GrantPermissionDialog` §32.6.
- [ ] Document usage pattern for product layer §32.7.

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — [`checkPermission()`](../../src/lib/permissions/check.ts) truth tables for `RESOURCE_ACTIONS` §32.4; RBAC-first then granular §32.8.
- **Integration** — Payload `access` + seeded `permissions` rows with **test DB**; [`actions/permissions.ts`](../../src/lib/actions/permissions.ts).

Checklist:

- [ ] Unit: deny when granular missing but RBAC would allow — confirm ordering §32.8.
- [ ] Integration: grant/revoke/list round-trip §32.5.

## Key paths (expected)

```
src/payload/collections/Permissions.ts
src/lib/permissions/check.ts
src/lib/permissions/types.ts
src/lib/actions/permissions.ts
src/components/permissions/
```

## Verification

- Owner/admin manage permissions; member denied (PRD §23.2 `permissions.spec.ts`).
- `checkPermission()` true/false cases §23.2.

## Notes

- **Do not** introduce Permit.io — PRD Section 2 table is outdated; §32 is canonical.
