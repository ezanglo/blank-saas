# Runbook — Redis / API rate limits

## Related env keys

See [`.env.example`](../../.env.example):

- `REDIS_URL` — Self-hosted Redis (`ioredis`) for IP-based API limiting and monthly quota counters when Upstash is not configured.
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` — Prefer on Vercel/serverless: REST sliding-window limiter for `/api/*`.
- `API_RATE_LIMIT_PER_MINUTE` — Soft ceiling per client IP (default **100** per minute); see [`src/lib/quota/limiter.ts`](../../src/lib/quota/limiter.ts).

## Behavior matrix

| Configuration | API IP rate limit (`src/proxy.ts`) | Monthly org quotas |
|---------------|-----------------------------------|--------------------|
| Upstash vars set | Sliding window via `@upstash/ratelimit` | Uses Upstash Redis |
| Only `REDIS_URL` | Fixed ~60s bucket via `ioredis` | Uses same Redis |
| Neither | **`noopLimit()` — always allows** | **Allows all consumption** (no persistence) |

## Redis unreachable

For **`REDIS_URL`** / `ioredis`:

- `limiter.ts` sets `maxRetriesPerRequest: 2`; transient failures can surface as **429** if increments fail mid-flight — watch Redis latency and connection counts.
- Prolonged outages: rate limiting may error or behave inconsistently depending on failure mode — prefer **managed Redis** with HA for production.

For **Upstash**:

- REST failures bubble through `@upstash/ratelimit`; treat elevated 429/5xx from Upstash as incidents — scale plan or region failover per vendor guidance.

## Proxy scope

[`src/proxy.ts`](../../src/proxy.ts) applies the IP limiter to `/api/*` **except** `/api/webhooks/stripe` (Stripe verifies separately). Other webhook routes may still be limited unless excluded — confirm ingress vs Next routing if third-party IP bursts hit limits.

## Operational checklist

1. Confirm production has **either** Upstash **or** `REDIS_URL` if you rely on enforcement (otherwise limits are off).
2. Load-test critical APIs after changing `API_RATE_LIMIT_PER_MINUTE`.
3. Alert on Redis connection errors correlated with traffic spikes.
