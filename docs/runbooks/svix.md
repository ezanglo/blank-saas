# Runbook — Svix

## Related env keys

See [`.env.example`](../../.env.example):

- `SVIX_SERVER_URL` — Svix HTTP API base URL (Compose dev default `http://127.0.0.1:8071`).
- `SVIX_AUTH_TOKEN` — JWT or API token for the app to manage Svix applications/endpoints (generate via Svix tooling / container docs).
- `SVIX_JWT_SECRET` — Must match the Svix server JWT secret (Compose uses root `.env`; Next uses `.env.local` — keep them aligned).
- `SVIX_WEBHOOK_SECRET` — Verifies **your** operational webhook `POST /api/webhooks/svix` (Svix → your app).

## Operational webhook

Production URL pattern:

`https://<your-production-host>/api/webhooks/svix`

Rotation: generate a new secret in Svix (or your ingress), update `SVIX_WEBHOOK_SECRET`, redeploy, then retire the old verifier.

## Svix API unavailable

If `SVIX_SERVER_URL` is unreachable:

- Org-level webhook provisioning UIs or server actions that call Svix may fail — users may see errors creating/updating endpoints.
- **Inbound** webhooks already configured at Svix continue to fire **to their consumer URLs**; only **management** calls through your app break until Svix is healthy again.

Monitor Svix status and increase timeouts only after confirming network path (VPC DNS, TLS, firewall).

## Docker / VPS notes

When Svix runs behind TLS termination:

- Ensure your app reaches Svix over an internal URL (`https://svix.internal…`) or mTLS if required by policy.
- JWT secret parity: changing `SVIX_JWT_SECRET` in Compose without rotating Svix server config causes **401** on management routes.

See also Phase 11 Svix notes in [`phase-11-docker-tests-readme.md`](../prd-v4-phases/phase-11-docker-tests-readme.md#verification).
