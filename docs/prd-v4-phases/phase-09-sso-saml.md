# Phase 9 — SSO / SAML (BoxyHQ Jackson + better-auth)

Maps to **Phase 9** and PRD **§31**, **§26** step **24**.

## Purpose

Enterprise SSO: Jackson sidecar, better-auth SAML plugin, per-org connection management, login discovery.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§31 SSO / SAML](../../nextjs-multitenant-starter-PRD-v4.md) | Architecture, Docker, plugin |
| [§31.4 SAML connection management](../../nextjs-multitenant-starter-PRD-v4.md) | Create/delete, Payload org `samlConnectionId` |
| [§31.5 SSO settings page](../../nextjs-multitenant-starter-PRD-v4.md) | Owner-only UI |
| [§31.6 SSO login flow](../../nextjs-multitenant-starter-PRD-v4.md) | Email domain / Jackson lookup |
| [§31.7 Audit events](../../nextjs-multitenant-starter-PRD-v4.md) | `sso.*`, `auth.sso_login` |

## Prerequisites

- Phase 2: `samlConnectionId` on Organizations.
- Phase 5: org settings area.
- **Jackson** service in Docker (Phase 11 or bring up early).

## Deliverables (checklist)

- [ ] Docker **jackson** service per §31.2 + env §24.4 (`JACKSON_*`, `SAML_AUDIENCE`).
- [ ] Add `saml()` plugin to `auth.ts` §31.3.
- [ ] `src/lib/actions/sso.ts` — `createSAMLConnection`, `deleteSAMLConnection` §31.4 (validate Jackson API responses in implementation).
- [ ] `/organizations/[orgSlug]/settings/sso` §31.5.
- [ ] Login page: “Sign in with SSO” when domain has SAML §31.6 — reconcile **tenant** strategy (orgId vs domain) during implementation (see plan risk notes).
- [ ] Audit + PostHog `sso_login` §31.7, §30.5.

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — SAML connection payload validation (URLs, entity IDs) before calling Jackson.
- **Integration** — [`sso.ts`](../../src/lib/actions/sso.ts) actions with **mocked fetch** to Jackson; owner vs non-owner §31.5.

Checklist:

- [ ] Unit: domain normalization / tenant key helpers §31.6.
- [ ] Integration: create/delete connection propagates `samlConnectionId` on Organizations §31.4.

## Key paths (expected)

```
src/lib/actions/sso.ts
src/lib/auth/auth.ts  # saml plugin
```

## Verification

- Owner can create/delete connection; non-owner denied.
- Playwright `sso.spec.ts` scenarios §23.2 (mock redirect as needed).

## Env vars

- `JACKSON_URL`, `JACKSON_API_KEY`, `JACKSON_PRODUCT`, `SAML_AUDIENCE`, plus shared DB URL for Jackson §31.2

## Notes

- Jackson uses same Postgres with separate `jackson_` tables — do not migrate those manually §31.2.
