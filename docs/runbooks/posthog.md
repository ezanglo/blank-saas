# Runbook — PostHog

## Related env keys

See [`.env.example`](../../.env.example):

- `NEXT_PUBLIC_POSTHOG_KEY` — Browser SDK key (omit to disable client analytics).
- `NEXT_PUBLIC_POSTHOG_HOST` — Ingest API host (default Cloud `https://app.posthog.com`).
- `POSTHOG_PERSONAL_API_KEY` — Server-side exports/automation only when features require it.

Client bootstrap lives in [`src/lib/analytics/client.tsx`](../../src/lib/analytics/client.tsx).

## Session replay / masking

Password and sensitive auth inputs use the **`ph-no-capture`** class (see Phase 8 checklist). Stripe Checkout is redirect-based — card data is not rendered in your DOM under normal flows.

When adding new sensitive widgets, add **`ph-no-capture`** or PostHog session-recording blocklists before shipping.

## CSP / third-party loads

If **Content-Security-Policy** is enforcing (see [`csp-matrix.md`](csp-matrix.md)), ensure `script-src` and `connect-src` include your `NEXT_PUBLIC_POSTHOG_HOST` origin — it is injected into the CSP builder from env at build time.

## Incidents

| Goal | Action |
|------|--------|
| Stop browser ingestion quickly | Remove or blank `NEXT_PUBLIC_POSTHOG_KEY` and redeploy; optionally pause project ingestion in PostHog Cloud UI |
| Verify outage vs SDK | Browser network tab — blocked requests to PostHog host |
| Server captures | Only flows using `posthog-node` fire when configured — see [`src/lib/analytics/server.ts`](../../src/lib/analytics/server.ts) |

## Privacy posture

Keep identifiable traits minimal in `identify()` payloads; align with your DPA and data residency choices for Cloud vs self-hosted PostHog.
