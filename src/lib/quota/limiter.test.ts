import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const redisIncrState = vi.hoisted(() => ({ n: 0 }));

vi.mock("ioredis", () => ({
  default: class MockIORedis {
    async incr() {
      redisIncrState.n += 1;
      return redisIncrState.n;
    }

    async expire() {
      return 1;
    }
  },
}));

describe("apiRateLimiter", () => {
  const saved = {
    REDIS_URL: process.env.REDIS_URL,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    API_RATE_LIMIT_PER_MINUTE: process.env.API_RATE_LIMIT_PER_MINUTE,
    NODE_ENV: process.env.NODE_ENV,
  };

  const patchEnv = process.env as Record<string, string | undefined>;

  afterEach(() => {
    patchEnv.REDIS_URL = saved.REDIS_URL;
    patchEnv.UPSTASH_REDIS_REST_URL = saved.UPSTASH_REDIS_REST_URL;
    patchEnv.UPSTASH_REDIS_REST_TOKEN = saved.UPSTASH_REDIS_REST_TOKEN;
    patchEnv.API_RATE_LIMIT_PER_MINUTE = saved.API_RATE_LIMIT_PER_MINUTE;
    patchEnv.NODE_ENV = saved.NODE_ENV;
  });

  describe("without Redis / Upstash", () => {
    beforeEach(() => {
      vi.resetModules();
      delete patchEnv.REDIS_URL;
      delete patchEnv.UPSTASH_REDIS_REST_URL;
      delete patchEnv.UPSTASH_REDIS_REST_TOKEN;
      patchEnv.NODE_ENV = "test";
    });

    it("allows every request (no-op limiter)", async () => {
      const { apiRateLimiter } = await import("./limiter");
      const a = await apiRateLimiter.limit("1.1.1.1");
      const b = await apiRateLimiter.limit("1.1.1.1");
      expect(a.success).toBe(true);
      expect(b.success).toBe(true);
    });
  });

  describe("with REDIS_URL (ioredis sliding window, mocked)", () => {
    beforeEach(() => {
      vi.resetModules();
      redisIncrState.n = 0;
      delete patchEnv.UPSTASH_REDIS_REST_URL;
      delete patchEnv.UPSTASH_REDIS_REST_TOKEN;
      patchEnv.REDIS_URL = "redis://127.0.0.1:6379";
      patchEnv.API_RATE_LIMIT_PER_MINUTE = "2";
      patchEnv.NODE_ENV = "test";
    });

    it("allows until count exceeds API_RATE_LIMIT_PER_MINUTE in the same window", async () => {
      const { apiRateLimiter } = await import("./limiter");
      expect(await apiRateLimiter.limit("9.9.9.9")).toMatchObject({
        success: true,
        remaining: 1,
      });
      expect(await apiRateLimiter.limit("9.9.9.9")).toMatchObject({
        success: true,
        remaining: 0,
      });
      expect(await apiRateLimiter.limit("9.9.9.9")).toMatchObject({
        success: false,
      });
    });
  });
});
