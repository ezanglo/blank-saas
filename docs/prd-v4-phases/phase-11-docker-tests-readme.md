# Phase 11 — Docker, Playwright, README, polish

Maps to **Phase 11** and PRD **§24**, **§23**, **§27**, **§10**, **§26** steps **21, 26–28**.

## Purpose

Containerized dev/prod, automated E2E coverage, onboarding docs, and global error/loading polish.

## PRD map

| PRD section | Topic |
|-------------|--------|
| [§24 Docker](../../nextjs-multitenant-starter-PRD-v4.md) | compose prod + dev, Dockerfile |
| [§23 Testing — Playwright](../../nextjs-multitenant-starter-PRD-v4.md) | Config + all specs |
| [§27 README](../../nextjs-multitenant-starter-PRD-v4.md) | Setup, migrations order, services |
| [§10 Error & loading](../../nextjs-multitenant-starter-PRD-v4.md) | `error.tsx`, 403, skeletons |
| [§24.4 .env.example](../../nextjs-multitenant-starter-PRD-v4.md) | Full variable list |

## Prerequisites

- Features from Phases 1–10 implemented enough for specs to run (or skip/xfail with clear tags).

## Deliverables (checklist)

- [ ] `docker-compose.yml` + `docker-compose.dev.yml` — postgres, redis, svix, jackson, posthog; dev adds **mailhog**, **minio** §24.1–24.2.
- [ ] `Dockerfile` multistage §24.3 — verify Payload/`public`/`.next` copy for chosen Payload version.
- [ ] `.env.example` mirroring §24.4 + comments for Svix JWT bootstrap §27.
- [ ] `playwright.config.ts` §23.1; `tests/fixtures/` §23.3.
- [ ] Spec files: `auth`, `organizations`, `members`, `invitations`, `marketing`, `audit-logs`, `webhooks`, `quota`, `billing`, `sso`, `permissions` §23.2.
- [ ] Global `error.tsx`, `not-found.tsx`, dashboard 403 pattern §10.2–10.3.
- [ ] README §27: one-command dev, migration order, MailHog/MinIO/Svix/Stripe/PostHog/Jackson notes, deployment checklist.

## Key paths (expected)

```
docker-compose.yml
docker-compose.dev.yml
Dockerfile
.env.example
playwright.config.ts
tests/e2e/
README.md
```

## Verification

- `docker compose -f docker-compose.dev.yml up` brings full dev stack §27.
- `npm run test` (Playwright) passes in CI-like env.
- New contributor can boot from README only.

## Notes

- Production checklist §27: real S3/SMTP, managed Redis option, admin email restriction, Stripe webhook URL, etc.

## Phase reference index

Return to [README.md](README.md) for the full phase table.
