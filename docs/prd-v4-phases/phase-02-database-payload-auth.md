# Phase 2 — Database, Payload, better-auth (core platform)

**Status:** complete in this repo (see checklist below).

Maps to **Phase 2** and PRD **§6, §4, §17, §5** and **§26** steps **3–5**.

## Purpose

Single Postgres database with a **shared Drizzle schema**: **Better Auth** on `drizzleAdapter(db)` targeting Payload-generated Drizzle exports, Payload collections mirroring auth/org data, **`push: false`**, and **Payload migrations** for DDL.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§6 Payload + better-auth](../../nextjs-multitenant-starter-PRD-v4.md) | Shared Drizzle, dual-write, table ownership |
| [§6.2 Shared Drizzle](../../nextjs-multitenant-starter-PRD-v4.md) | `getDb()`, dedicated `db` pool for BA |
| [§4 Authentication](../../nextjs-multitenant-starter-PRD-v4.md) | `auth.ts`, client, API route |
| [§4.6 Schema migration](../../nextjs-multitenant-starter-PRD-v4.md) | See **migration model** below (Finn-style: one schema, Payload migrations). |
| [§17 Payload configuration](../../nextjs-multitenant-starter-PRD-v4.md) | Collections, S3, migrations |
| [§32.2 Permissions collection](../../nextjs-multitenant-starter-PRD-v4.md) | Schema for granular perms (not Permit.io) |

## Prerequisites

- Phase 1 scaffold.
- Local or Docker **PostgreSQL 16** (or compatible) with `DATABASE_URL`.

## Deliverables (checklist)

- [x] **`src/lib/db/index.ts`** — **`db`**: Drizzle pool for Better Auth at module load; **`getDb()`**: Payload’s Drizzle via `getPayload()` (PRD §6.2 hybrid).
- [x] **`src/payload.config.ts`** — Postgres adapter, **`push: false`**, **`migrationDir`/`prodMigrations`**, lexical editor, S3/R2 plugin (enabled when bucket env is set), **`generateSchemaOutputFile`** → **`src/payload-generated-schema.ts`**. Root **`package.json`** has **`"type": "module"`** so **`@/`** and Payload CLI behave like Finn.
- [x] **Payload routes (Next App Router)** — implemented under **`src/app/(payload)/`**: **`api/[...slug]`**, **`api/graphql`**, **`api/graphql-playground`**, admin **`/admin`** via **`admin/[[...segments]]`** and layout (Payload + Next integration; not `src/app/api/[...payload]/`). Treat `(payload)` as scaffold/CLI-aligned; regenerate import map with **`pnpm generate:importmap`** when needed.
- [x] **Collections** (`src/collections/**`, `@/` imports in config):  
  **Users** (Better Auth–backed session via custom strategy; **`disableLocalStrategy`**, Payload admin/session integration), **TwoFactors**, **Media**, **Organizations** (name, slug, plan, **`svixAppId`**, Stripe fields, **`samlConnectionId`**; org **id** is the shared BA/Payload identifier — no separate **`betterAuthOrgId`** field), Sessions/Accounts/Verifications (**`user_sessions`**, **`user_accounts`**, **`user_verifications`** slugs for Drizzle mapper), Members, Invitations, **AuditLogs**, **FeatureFlags**, **Permissions** (payload-level access tightened where applicable).
- [x] **`src/lib/auth.ts`** — **`drizzleAdapter(db)`** mapping to **`payload-generated-schema`** (**`user`/`session`/`account`/`verification`/`organization`/`member`/`invitation`/`twoFactor`** aliases), **`organization`** + **`admin`** plugins, **`emailAndPassword`**, **`twoFactor()`**, **`magicLink()`**, email verification hooks, optional Google OAuth when env is set.
- [x] **`src/lib/auth-client.ts`** matching client plugins; **`src/app/api/auth/[...all]/route.ts`** via **`toNextJsHandler`**.
- [x] **`src/lib/auth/payload-access.ts`** (and **`src/lib/auth/headers.ts`** for Next → Web **`Headers`**), for Payload **`access`** helpers / session bridging.
- [x] **Org mutations** — **`src/lib/actions/organization.ts`**: **`createOrganizationAction`** / **`deleteOrganizationAction`** using Better Auth API + session headers (PRD §6.5–6.6 wiring; polish like **`createAuditLog`** hooks can land in Phase 6 or ad hoc).
- [x] **Migrations workflow** — No separate **`auth migrate`** CLI: DDL is **`payload migrate:create`** / **`pnpm payload migrate`** (or **`pnpm migrate`**). After schema changes: **`pnpm generate:db-schema`** → **`pnpm generate:types`**, then create migration, merge into **`src/migrations/index.ts`**, **`pnpm migrate`**. Scripts: **`generate:db-schema`**, **`generate:types`**, **`generate:importmap`**, **`migrate`**.

### Key paths (actual, this repo)

```
src/payload.config.ts
src/lib/db/index.ts
src/lib/auth.ts
src/lib/auth-client.ts
src/lib/email.ts                     # transactional email (SMTP or console stub)
src/lib/auth/payload-access.ts
src/lib/auth/headers.ts
src/lib/actions/organization.ts
src/lib/audit/log.ts                  # Payload overrideAccess audit creates
src/collections/**                   # Payload collection configs consumed by config
src/migrations/index.ts               # prodMigrations list (edited by migrate:create output)
src/payload-generated-schema.ts       # Drizzle schema (pnpm generate:db-schema)
src/payload-types.ts                  # Payload generated types (pnpm generate:types)
src/app/(payload)/**                  # Payload API + admin app routes + import map
src/app/api/auth/[...all]/route.ts
```

## Verification (done criteria)

- [x] **`pnpm migrate`** applies registered migrations cleanly on Postgres (then **`pnpm payload migrate:status`** shows migrations **Ran: Yes** when up to date).
- [x] **`pnpm build`** succeeds with **`DATABASE_URL`/secrets** loaded for config resolution.
- [x] Payload admin available at **`/admin`** subject to **`Users`** **`access`** (admin-role gate today).
- [x] Better Auth responds on **`/api/auth/*`** (sign-up/sign-in/session), even without finished marketing/auth UI.

## Env vars (Phase 2 minimum)

See [`.env.example`](../../.env.example):

- `DATABASE_URL`, `PAYLOAD_SECRET`
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (and **`NEXT_PUBLIC_APP_URL`** fallback in code)
- Optional: S3/MinIO or R2 (Media); SMTP for real email (**omitting `SMTP_HOST`** uses console stubs in dev-friendly paths)

## Notes

- Never hand-edit auth tables owned by Payload/migrations from a second migration tool; **`payload-generated-schema.ts`** is the single Drizzle truth for **`drizzleAdapter`** (PRD §17.3 spirit).
- PRD **`auth:generate` → `auth:migrate`** path applies when Better Auth migrations are maintained separately; this repo follows **shared schema + Payload-only migrations**.
- **`pnpm run migrate:create -- --name …`** is unsafe with pnpm: it can invoke **`payload migrate:create -- --name …`**. Prefer **`pnpm payload migrate:create --name <slug>`** (or **`pnpm exec payload migrate:create --name <slug>`**).
- Section 17.1 “Permissions → §29.3” is wrong — use **§32** for the Permissions collection (unchanged PRD caveat).
