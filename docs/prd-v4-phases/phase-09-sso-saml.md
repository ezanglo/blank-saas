# Phase 9 — SSO / SAML (Better Auth `@better-auth/sso`; Jackson optional)

Maps to **Phase 9** and PRD **§31**, **§26** step **24**.

## Purpose

Enterprise SSO via **Better Auth `@better-auth/sso`** (native SAML SP routes under `/api/auth`), **Payload-owned `sso_providers` table**, per-org IdP configuration, and login discovery by email domain. **BoxyHQ Jackson** remains optional (legacy PRD §31 sidecar) — see Docker comments and `.env.example`.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§31 SSO / SAML](../../nextjs-multitenant-starter-PRD-v4.md) | Architecture, Docker, plugin |
| [§31.4 SAML connection management](../../nextjs-multitenant-starter-PRD-v4.md) | Create/delete, Payload org `samlConnectionId` |
| [§31.5 SSO settings page](../../nextjs-multitenant-starter-PRD-v4.md) | Owner-only UI |
| [§31.6 SSO login flow](../../nextjs-multitenant-starter-PRD-v4.md) | Email domain lookup → `/api/auth/sign-in/sso` |
| [§31.7 Audit events](../../nextjs-multitenant-starter-PRD-v4.md) | `sso.*`, `auth.sso_login` |

## Prerequisites

- Phase 2: `samlConnectionId` on Organizations.
- Phase 5: org settings area.
- *(Optional)* **Jackson** sidecar only if you adopt BoxyHQ instead of native SAML — see Docker compose comments.

## Deliverables (checklist)

- [x] Docker **jackson** service (optional) — Compose **`profiles: [jackson]`** in [`docker-compose.dev.yml`](../../docker-compose.dev.yml): `docker compose -f docker-compose.dev.yml --profile jackson up -d`; env in [`.env.example`](../../.env.example).
- [x] SSO plugin: **`sso()`** from `@better-auth/sso` in [`src/lib/auth.ts`](../../src/lib/auth.ts); Drizzle maps **`ssoProvider`** → **`sso_providers`** (Payload collection [`SsoProviders`](../../src/collections/auth/SsoProviders.ts)).
- [x] [`src/lib/actions/sso.ts`](../../src/lib/actions/sso.ts) — create/delete SAML connection via **`auth.api.registerSSOProvider` / `deleteSSOProvider`**; org **`samlConnectionId`** stores stable **`sso-<orgUuid>`** ([`orgSsoProviderId`](../../src/lib/sso/org-sso-provider-id.ts)).
- [x] [`/organizations/[orgSlug]/settings/sso`](../../src/app/(frontend)/(protected)/organizations/[orgSlug]/settings/sso/page.tsx) — owner-only ([`canConfigureSso`](../../src/lib/auth/rbac.ts)).
- [x] Sign-in: domain probe + “Continue with SSO” when enrolled ([`sign-in-form.tsx`](../../src/components/auth/sign-in-form.tsx), [`sso-domain.ts`](../../src/lib/actions/sso-domain.ts)).
- [x] Audit **`auth.sso_login`** / **`sso.*`** + PostHog **`sso_login`** ([`post-login.ts`](../../src/lib/sso/post-login.ts), auth middleware hook in [`auth.ts`](../../src/lib/auth.ts)).

## Tests (unit / integration)

Conventions: [phase-11](phase-11-docker-tests-readme.md).

- **Unit** — IdP metadata parsing (`resolveSamlIssuer`, `fetchIdpMetadataXml`), stable provider id, SAML callback path parsing, audit/analytics emit, domain SSO probe (see `src/lib/sso/**`, `src/lib/actions/sso-domain*.ts`).
- **Integration** — [`sso.ts`](../../src/lib/actions/sso.ts) server actions with mocked Better Auth API + Drizzle (`tests/integration/sso-actions.test.ts`).

Checklist:

- [x] Unit: domain normalization / SAML metadata helpers — [`saml-metadata.test.ts`](../../src/lib/sso/saml-metadata.test.ts), [`org-sso-provider-id.test.ts`](../../src/lib/sso/org-sso-provider-id.test.ts), path parsing [`post-login.test.ts`](../../src/lib/sso/post-login.test.ts).
- [x] Unit: SSO login audit/analytics + domain discovery — [`post-login.emit.test.ts`](../../src/lib/sso/post-login.emit.test.ts), [`sso-domain.test.ts`](../../src/lib/actions/sso-domain.test.ts).
- [x] Integration — mocked Better Auth + DB for SSO actions — [`tests/integration/sso-actions.test.ts`](../../tests/integration/sso-actions.test.ts) (`pnpm test:integration`).
- [x] E2E smoke — [`tests/e2e/sso.spec.ts`](../../tests/e2e/sso.spec.ts) (`pnpm test:e2e`; running app + `pnpm exec playwright install chromium` once).

## Phase completion

**Phase 9 is complete** in this repo for the planned scope: Better Auth SAML, Payload `sso_providers`, owner settings UI, sign-in discovery, audit/PostHog hooks, unit/integration/E2E smoke, optional Jackson Compose profile.

**Deferred:** manual SAML round-trip with a real or test IdP before production (optional for local dev).

## Key paths (expected)

```
src/lib/actions/sso.ts
src/lib/auth.ts       # betterAuth + sso() plugin + SAML callback middleware hook
src/collections/auth/SsoProviders.ts
src/payload-generated-schema.ts   # pnpm generate:db-schema
tests/integration/sso-actions.test.ts
tests/e2e/sso.spec.ts
playwright.config.ts
docker-compose.dev.yml             # optional `--profile jackson`
```

## Verification

Use when you validate manually or before production (skipped for now is fine for local dev):

- Owner can create/delete connection; non-owner denied (`canConfigureSso`).
- Sign-in shows SSO when `sso_providers.domain` matches the email domain.
- After SAML ACS/callback, **`auth.sso_login`** audit and PostHog **`sso_login`** run when org **`samlConnectionId`** matches the provider id ([`emitSsoLoginAuditAndAnalytics`](../../src/lib/sso/post-login.ts)).
- Payload-driven **user delete**: **`Users` `beforeDelete`** clears org **`samlConnectionId`** and removes **`sso-providers`** rows for that user; non-Payload deletes may still need matching DB FK behavior if you use those paths.

## Env vars

- **Better Auth SSO**: canonical URLs (`BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`); optional **`SAML_SP_PRIVATE_KEY`** — see `.env.example`.
- **Jackson only** (optional sidecar): `JACKSON_URL`, `JACKSON_API_KEY`, `JACKSON_PRODUCT`, `SAML_AUDIENCE`, Postgres URL §31.2

## Notes

- Jackson uses same Postgres with separate `jackson_` tables — do not migrate those manually §31.2.
