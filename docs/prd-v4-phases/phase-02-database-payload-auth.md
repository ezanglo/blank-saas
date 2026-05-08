# Phase 2 — Database, Payload, better-auth (core platform)

Maps to **Phase 2** and PRD **§6, §4, §17, §5** and **§26** steps **3–5**.

## Purpose

Single Postgres database with a **shared Drizzle pool** from Payload, **better-auth** on `drizzleAdapter`, Payload collections (including org mirror), and correct **migration order**.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§6 Payload + better-auth](../../nextjs-multitenant-starter-PRD-v4.md) | Shared Drizzle, dual-write, table ownership |
| [§6.2 Shared Drizzle](../../nextjs-multitenant-starter-PRD-v4.md) | `getDb()` singleton |
| [§4 Authentication](../../nextjs-multitenant-starter-PRD-v4.md) | `auth.ts`, client, API route |
| [§4.6 Schema migration](../../nextjs-multitenant-starter-PRD-v4.md) | Order: better-auth → Payload |
| [§17 Payload configuration](../../nextjs-multitenant-starter-PRD-v4.md) | Collections, S3, migrations |
| [§32.2 Permissions collection](../../nextjs-multitenant-starter-PRD-v4.md) | Schema for granular perms (not Permit.io) |

## Prerequisites

- Phase 1 scaffold.
- Local or Docker **PostgreSQL 16** available with `DATABASE_URL`.

## Deliverables (checklist)

- [ ] `src/lib/db/index.ts` — expose Drizzle from Payload (PRD §6.2).
- [ ] `payload.config.ts` + `src/app/api/[...payload]/route.ts` (verify path against Payload + Next 16 docs).
- [ ] Collections: **Users** (`auth: false`), **Media** (S3 — MinIO in dev), **Organizations** (mirror: `betterAuthOrgId`, `plan`, `svixAppId`, Stripe fields, `samlConnectionId`), **AuditLogs**, **FeatureFlags**, **Permissions**.
- [ ] `src/lib/auth/auth.ts` — `drizzleAdapter(db)`, organization plugin, email/password, 2FA, magic link, email verification. **Defer SAML plugin** until Phase 9 unless you prefer early wiring behind feature flag.
- [ ] `src/lib/auth/auth-client.ts`, `src/app/api/auth/[...all]/route.ts`.
- [ ] `src/lib/auth/payload-access.ts` — `getSessionForAccess()` for Payload `access`.
- [ ] Org **create/delete** dual-write and cleanup (PRD §6.5–6.6).
- [ ] Migrations: `auth:generate` → `auth:migrate` → `payload migrate:create` → `payload migrate` (PRD §4.6, §17.3).

## Key paths (expected)

```
src/lib/db/index.ts
src/lib/auth/auth.ts
src/lib/auth/auth-client.ts
src/lib/auth/payload-access.ts
src/payload/collections/*.ts
payload.config.ts
```

## Verification

- Both migration families apply cleanly on a fresh DB.
- Payload admin loads at `/admin` (with access rules from PRD §6.4).
- Sign-up/sign-in API responds (even before marketing UI is polished).

## Env vars (Phase 2 minimum)

- `DATABASE_URL`
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- S3 / MinIO vars for Media (PRD §24.4)

## Notes

- Never hand-edit better-auth tables; never mix migration files between systems (PRD §17.3).
- Section 17.1 “Permissions → §29.3” is wrong — use **§32** for the Permissions collection.
