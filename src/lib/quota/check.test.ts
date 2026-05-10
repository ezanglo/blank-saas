import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { PlanKey } from "@/lib/quota/plans";

vi.mock("@/lib/quota/member-count", () => ({
  countOrgMembers: vi.fn(async () => 2),
}));

vi.mock("@/lib/webhooks/endpoint-count", () => ({
  countWebhookEndpointsForOrg: vi.fn(async () => 0),
}));

vi.mock("@/lib/quota/warn-email", () => ({
  maybeSendQuotaWarningEmail: vi.fn(async () => {}),
}));

vi.mock("@/lib/quota/limiter", () => ({
  createMonthlyQuotaLimiter: vi.fn(() => ({
    async limit() {
      return {
        success: true,
        limit: 1000,
        remaining: 500,
        reset: Date.now(),
        pending: Promise.resolve(),
      };
    },
  })),
  monthlyQuotaId: "monthly",
}));

describe("checkQuota", () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
    vi.resetModules();
  });

  it("returns unlimited for enterprise apiCallsPerMonth", async () => {
    const { checkQuota } = await import("./check");
    const r = await checkQuota("org-1", "enterprise" as PlanKey, "apiCallsPerMonth");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(Number.POSITIVE_INFINITY);
  });

  it("denies members when at plan member limit", async () => {
    const { countOrgMembers } = await import("@/lib/quota/member-count");
    vi.mocked(countOrgMembers).mockResolvedValueOnce(5);

    const { checkQuota } = await import("./check");
    const r = await checkQuota("org-1", "free" as PlanKey, "membersPerOrg");
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
    expect(r.limit).toBe(5);
  });

  it("allows members when under limit", async () => {
    const { countOrgMembers } = await import("@/lib/quota/member-count");
    vi.mocked(countOrgMembers).mockResolvedValueOnce(3);

    const { checkQuota } = await import("./check");
    const r = await checkQuota("org-1", "free" as PlanKey, "membersPerOrg");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(2);
  });
});
