<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Payload Next routes

Do **not** edit anything under `src/app/(payload)/` by hand (admin pages, `/api/[...slug]`, GraphQL routes, Payload layout/import map, Payload SCSS). Those files follow Payload’s generated/scaffold patterns. Fix types, wrappers, config, or app behavior outside that tree (e.g. `src/payload.config.ts`, `src/lib/**`, root `next.config`). If something in `(payload)` must change, regenerate or update via Payload’s CLI/docs and `@payloadcms/next` upgrades—not one-off edits in-repo.
<!-- END:nextjs-agent-rules -->
