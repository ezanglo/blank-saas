import { describe, expect, it } from "vitest";

import { PLANS, type PlanKey } from "./plans";

describe("PLANS", () => {
  it("defines numeric limits for free tier", () => {
    expect(PLANS.free.apiCallsPerMonth).toBe(1_000);
    expect(PLANS.free.membersPerOrg).toBe(5);
  });

  it("uses infinity for enterprise quotas", () => {
    expect(PLANS.enterprise.apiCallsPerMonth).toBe(Number.POSITIVE_INFINITY);
  });

  it("admits known plan keys", () => {
    const keys: PlanKey[] = ["free", "pro", "enterprise"];
    expect(keys.length).toBe(3);
  });
});
