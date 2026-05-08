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

- [ ] `src/app/` skeleton: route groups `(marketing)`, `(auth)`, `(dashboard)` placeholder layouts; `api/` folder ready.
- [ ] Dependencies: framework stack from PRD §2 as needed for Phase 1 (Zod, RHF, TanStack Query can be installed here or when forms land).
- [ ] **shadcn/ui** init — **new-york** style; `src/components/ui/`.
- [ ] **Tailwind v4** + CSS variables; **Inter** via `next/font/google` in root layout.
- [ ] **next-themes** + theme toggle pattern (user nav comes in Phase 5; root provider can live earlier).
- [ ] **sonner** toast provider in root layout.
- [ ] [`next.config.ts`](../../next.config.ts): baseline edits from PRD §11 (defer Payload wrapper to Phase 2 if it breaks the build before Payload exists).

## Key paths (expected)

```
src/app/(marketing)/
src/app/(auth)/
src/app/(dashboard)/
src/app/api/
src/components/ui/
```

## Verification

- `npm run dev` starts; root page or placeholder renders.
- `npm run build` succeeds (once minimal routes exist).
- shadcn components can be imported without style regressions.

## Notes

- Install the full dependency matrix from PRD §2 incrementally if it speeds up review; minimum for Phase 1 is structure + design system + scripts you will need immediately.
