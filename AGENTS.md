<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Payload Next routes

Do **not** edit anything under `src/app/(payload)/` by hand (admin pages, `/api/[...slug]`, GraphQL routes, Payload layout/import map, Payload SCSS). Those files follow Payload’s generated/scaffold patterns. Fix types, wrappers, config, or app behavior outside that tree (e.g. `src/payload.config.ts`, `src/lib/**`, root `next.config`). If something in `(payload)` must change, regenerate or update via Payload’s CLI/docs and `@payloadcms/next` upgrades—not one-off edits in-repo.

## Payload Postgres migrations

- **Never** hand-write migration `.ts` files under `src/migrations/`. Always generate DDL with **`pnpm payload migrate:create`** (optionally **`pnpm payload migrate:create --name <slug>`**) after schema changes.
- Typical flow when collections change: **`pnpm generate:db-schema`** → **`pnpm generate:types`** → **`pnpm payload migrate:create`** → ensure the new migration is imported into **`src/migrations/index.ts`** (`prodMigrations`) → apply locally with **`pnpm migrate`**.
- Prefer **`pnpm payload migrate:create`** directly (shortcut: **`pnpm migrate:create`**); avoid **`pnpm run migrate:create -- --name …`**, which can mishandle args under pnpm.
- **`migrate:create`** diffs **generated schema** against the **latest migration snapshot** (the companion `.json`), not your live Postgres database. If that snapshot incorrectly lists tables/columns that earlier `.ts` migrations never applied, Payload reports “no schema changes.” Repair the snapshot so it matches cumulative DDL from existing migrations, then run **`pnpm migrate:create`** again.
<!-- END:nextjs-agent-rules -->
