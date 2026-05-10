# Phase 1 — Scaffold and design system

Maps to implementation plan **Phase 1** and PRD **Section 26** steps **1–2** (scaffold, Tailwind/shadcn, partial deps).

## Purpose

Establish the repository shape, UI foundation, and build tooling so later phases can add Payload, auth, and features without rework.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§3 Repository Structure](../../nextjs-multitenant-starter-PRD-v4.md) | `src/app` route groups, `components`, `lib` layout |
| [§2 Tech Stack](../../nextjs-multitenant-starter-PRD-v4.md) | Core packages to install |
| [§22 Theming & Design](../../nextjs-multitenant-starter-PRD-v4.md) | shadcn new-york, Inter, dark mode, sonner |
| [§11 next.config.ts](../../nextjs-multitenant-starter-PRD-v4.md) | Image patterns, transpile (full `withPayload` often lands in Phase 2) |
| [§25 Development Scripts](../../nextjs-multitenant-starter-PRD-v4.md) | npm scripts scaffold |

## Prerequisites

- Node 22+ (per PRD / Docker baseline).
- Empty or minimal app (current `blank-saas` state).

## Deliverables (checklist)

- [x] `src/app/` skeleton: **`(frontend)/`** wraps `(marketing)`, `(auth)`, **`(protected)`** (authenticated app shell — Phase 5; PRD stubs may say `(dashboard)`) (`(frontend)/layout.tsx` owns the product `<html>`); **`(payload)/`** sibling for Payload admin (own document via `@payloadcms/next`); **`api/`** routes at `src/app/api/`.
- [x] Dependencies: framework stack from PRD §2 as needed for Phase 1 (Zod, RHF, TanStack Query can be installed here or when forms land).
- [x] **shadcn/ui** init — **new-york** style; `src/components/ui/`.
- [x] **Tailwind v4** + CSS variables; **Inter** via `next/font/google` in root layout.
- [x] **next-themes** + theme toggle pattern (user nav comes in Phase 5; root provider can live earlier).
- [x] **sonner** toast provider in root layout.
- [x] [`next.config.ts`](../../next.config.ts): baseline edits from PRD §11; **`withPayload`** from `@payloadcms/next/withPayload` is wired (Phase 2+).

## Tests (unit / integration)

Conventions: [phase-11 — Docker, tests, README](phase-11-docker-tests-readme.md) defines Vitest paths and CI. Write tests **with** deliverables below; CI runs them once Phase 11 adds scripts.

- **Unit** — Vitest; colocate `src/**/*.test.ts` (see Phase 11); optional [`tests/unit/`](../../tests/unit/) mirror layout.
- **Integration** — real routes/DB: [`tests/integration/`](../../tests/integration/) when APIs exist.
- **E2E** — Playwright only in Phase 11 (PRD §23).

Checklist for this phase:

- [x] `pnpm test:unit` (Vitest) available — runs in CI ([phase-11](phase-11-docker-tests-readme.md)).
- [ ] Optional: unit smoke for shared helpers (e.g. `cn` in [`src/lib/utils.ts`](../../src/lib/utils.ts)) if behavior must stay stable.
- [x] **Verification:** `pnpm build` and `pnpm dev` validated locally; CI runs lint, typecheck, unit, integration, and E2E ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)).

## Key paths (expected)

```
src/app/layout.tsx               # mandatory Next root — pass‑through document (Payload + frontend each own `<html>`)
src/app/(frontend)/layout.tsx
src/app/(frontend)/(marketing)/
src/app/(frontend)/(auth)/
src/app/(frontend)/(protected)/    # authenticated product (Phase 5)
src/app/(payload)/
src/app/api/
src/components/ui/
```

## Verification

- `npm run dev` starts; root page or placeholder renders.
- `npm run build` succeeds (once minimal routes exist).
- shadcn components can be imported without style regressions.

## Notes

- Install the full dependency matrix from PRD §2 incrementally if it speeds up review; minimum for Phase 1 is structure + design system + scripts you will need immediately.
