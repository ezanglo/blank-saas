import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

const apiPerMinute = Number(process.env.API_RATE_LIMIT_PER_MINUTE ?? 100);

const monthlyQuotaId = "monthly";

type LimitResult = {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  pending: Promise<unknown>;
};

function noopLimit(): LimitResult {
  return {
    success: true,
    limit: apiPerMinute,
    remaining: apiPerMinute,
    reset: Date.now(),
    pending: Promise.resolve(),
  };
}

/** Fixed-window IP limiter using ioredis (self-hosted `REDIS_URL` only). */
function createIoredisApiLimiter(redis: IORedis) {
  const windowSec = 60;
  return {
    async limit(identifier: string): Promise<LimitResult> {
      const bucket = Math.floor(Date.now() / 1000 / windowSec);
      const key = `rl:api:${identifier}:${bucket}`;
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, windowSec + 5);
      const success = n <= apiPerMinute;
      return {
        success,
        limit: apiPerMinute,
        remaining: Math.max(0, apiPerMinute - n),
        reset: (bucket + 1) * windowSec * 1000,
        pending: Promise.resolve(),
      };
    },
  };
}

function createIoredisMonthlyQuotaLimiter(
  redis: IORedis,
  orgId: string,
  resource: string,
  limit: number,
) {
  const prefix = `quota:${orgId}:${resource}`;
  return {
    async limit(id: string): Promise<LimitResult> {
      const monthKey = new Date().toISOString().slice(0, 7);
      const key = `${prefix}:${monthKey}:${id}`;
      const n = await redis.incr(key);
      if (n === 1) await redis.expire(key, 40 * 24 * 60 * 60);
      const success = n <= limit;
      return {
        success,
        limit,
        remaining: Math.max(0, limit - n),
        reset: Date.now() + 86_400_000 * 30,
        pending: Promise.resolve(),
      };
    },
    async getRemaining(id: string): Promise<{ remaining: number; limit: number; reset: number }> {
      const monthKey = new Date().toISOString().slice(0, 7);
      const key = `${prefix}:${monthKey}:${id}`;
      const raw = await redis.get(key);
      const n = raw ? Number(raw) : 0;
      return {
        remaining: Math.max(0, limit - n),
        limit,
        reset: Date.now() + 86_400_000 * 30,
      };
    },
  };
}

let _apiLimiter: { limit: (id: string) => Promise<LimitResult> } | null = null;
let _ioredis: IORedis | null = null;

function getApiLimiter() {
  if (_apiLimiter) return _apiLimiter;

  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) {
    const redis = Redis.fromEnv();
    _apiLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(apiPerMinute, "1 m"),
      prefix: "rl:api",
    });
    return _apiLimiter;
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    _ioredis = new IORedis(redisUrl, { maxRetriesPerRequest: 2 });
    _apiLimiter = createIoredisApiLimiter(_ioredis);
    return _apiLimiter;
  }

  _apiLimiter = {
    async limit() {
      if (process.env.NODE_ENV === "development") {
        console.warn(
          "[quota/limiter] No UPSTASH_* or REDIS_URL — API rate limiting disabled",
        );
      }
      return noopLimit();
    },
  };
  return _apiLimiter;
}

export const apiRateLimiter = {
  limit: (id: string) => getApiLimiter().limit(id),
};

/** Shared Redis for quota counters + warn keys (PRD §16). */
export function getRedisForQuota(): IORedis | Redis | null {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (upstashUrl && upstashToken) return Redis.fromEnv();
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl) {
    if (!_ioredis) _ioredis = new IORedis(redisUrl, { maxRetriesPerRequest: 2 });
    return _ioredis;
  }
  return null;
}

/**
 * Per-org, per-resource monthly quota (PRD §16.3).
 * Prefix includes resource key so `apiCallsPerMonth` and `membersPerOrg` do not share one counter.
 */
export function createMonthlyQuotaLimiter(orgId: string, resource: string, limit: number) {
  const redis = getRedisForQuota();
  if (!redis) {
    return {
      async limit(id: string): Promise<LimitResult> {
        void id;
        return {
          success: true,
          limit,
          remaining: limit,
          reset: Date.now(),
          pending: Promise.resolve(),
        };
      },
    };
  }

  if (redis instanceof Redis) {
    return new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(limit, "30 d"),
      prefix: `quota:${orgId}:${resource}`,
    });
  }

  return createIoredisMonthlyQuotaLimiter(redis, orgId, resource, limit);
}

/** Read current usage without consuming quota (for usage dashboard). */
export async function getMonthlyQuotaSnapshot(
  orgId: string,
  resource: string,
  limit: number,
): Promise<{ used: number; remaining: number; limit: number }> {
  if (!Number.isFinite(limit) || limit === Number.POSITIVE_INFINITY) {
    return { used: 0, remaining: Number.POSITIVE_INFINITY, limit: Number.POSITIVE_INFINITY };
  }

  const redis = getRedisForQuota();
  if (!redis) {
    return { used: 0, remaining: limit, limit };
  }

  if (redis instanceof Redis) {
    const r = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(limit, "30 d"),
      prefix: `quota:${orgId}:${resource}`,
    });
    const rem = await r.getRemaining(monthlyQuotaId);
    const used = Math.max(0, rem.limit - rem.remaining);
    return { used, remaining: rem.remaining, limit: rem.limit };
  }

  const snap = await createIoredisMonthlyQuotaLimiter(redis, orgId, resource, limit).getRemaining(
    monthlyQuotaId,
  );
  const used = Math.max(0, snap.limit - snap.remaining);
  return { used, remaining: snap.remaining, limit: snap.limit };
}

export { monthlyQuotaId };
