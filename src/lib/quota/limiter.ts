import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import IORedis from "ioredis";

const apiPerMinute = Number(process.env.API_RATE_LIMIT_PER_MINUTE ?? 100);

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

function createIoredisMonthlyQuotaLimiter(redis: IORedis, orgId: string, limit: number) {
  const prefix = `quota:${orgId}`;
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

function getRedisForQuota(): IORedis | Redis | null {
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

/** Per-org monthly quota (PRD §16.3). Uses Upstash Ratelimit when REST env is set; otherwise ioredis fixed bucket. */
export function createMonthlyQuotaLimiter(orgId: string, limit: number) {
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
      prefix: `quota:${orgId}`,
    });
  }

  return createIoredisMonthlyQuotaLimiter(redis, orgId, limit);
}
