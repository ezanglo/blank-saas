import { describe, expect, it } from "vitest";

import {
  listAllowedPriceIds,
  planFromPriceId,
  resolveStripePricesFromEnv,
  tryResolveStripePricesFromEnv,
} from "@/lib/billing/plans";

describe("resolveStripePricesFromEnv", () => {
  it("throws when any STRIPE_PRICE_* is missing", () => {
    expect(() =>
      resolveStripePricesFromEnv({
        STRIPE_PRICE_PRO_MONTHLY: "price_m",
        STRIPE_PRICE_PRO_YEARLY: "",
        STRIPE_PRICE_ENTERPRISE_MONTHLY: "price_e",
      }),
    ).toThrow(/Missing STRIPE_PRICE_/);
  });

  it("returns structured prices when all set", () => {
    const env = {
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_m",
      STRIPE_PRICE_PRO_YEARLY: "price_pro_y",
      STRIPE_PRICE_ENTERPRISE_MONTHLY: "price_ent_m",
    };
    expect(resolveStripePricesFromEnv(env)).toEqual({
      pro: { monthly: "price_pro_m", yearly: "price_pro_y" },
      enterprise: { monthly: "price_ent_m" },
    });
  });
});

describe("tryResolveStripePricesFromEnv", () => {
  it("returns null when any STRIPE_PRICE_* is missing", () => {
    expect(
      tryResolveStripePricesFromEnv({
        STRIPE_PRICE_PRO_MONTHLY: "price_m",
        STRIPE_PRICE_PRO_YEARLY: "",
        STRIPE_PRICE_ENTERPRISE_MONTHLY: "price_e",
      }),
    ).toBeNull();
  });

  it("returns same shape as resolve when all set", () => {
    const env = {
      STRIPE_PRICE_PRO_MONTHLY: "price_pro_m",
      STRIPE_PRICE_PRO_YEARLY: "price_pro_y",
      STRIPE_PRICE_ENTERPRISE_MONTHLY: "price_ent_m",
    };
    expect(tryResolveStripePricesFromEnv(env)).toEqual(resolveStripePricesFromEnv(env));
  });
});

describe("planFromPriceId", () => {
  const prices = {
    pro: { monthly: "pm", yearly: "py" },
    enterprise: { monthly: "em" },
  };

  it("maps known price IDs", () => {
    expect(planFromPriceId("pm", prices)).toBe("pro");
    expect(planFromPriceId("py", prices)).toBe("pro");
    expect(planFromPriceId("em", prices)).toBe("enterprise");
    expect(planFromPriceId("unknown", prices)).toBe("free");
  });
});

describe("listAllowedPriceIds", () => {
  it("includes all catalog prices", () => {
    const prices = {
      pro: { monthly: "a", yearly: "b" },
      enterprise: { monthly: "c" },
    };
    expect(listAllowedPriceIds(prices)).toEqual(new Set(["a", "b", "c"]));
  });
});
