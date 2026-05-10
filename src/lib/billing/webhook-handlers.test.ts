import { describe, expect, it } from "vitest";

import {
  mapStripeSubscriptionStatus,
  orgStripePatchForPaymentFailed,
  orgStripePatchForSubscriptionDeleted,
  orgStripePatchFromSubscription,
  primaryPriceIdFromSubscription,
} from "@/lib/billing/webhook-handlers";

const prices = {
  pro: { monthly: "price_pm", yearly: "price_py" },
  enterprise: { monthly: "price_em" },
};

describe("mapStripeSubscriptionStatus", () => {
  it("maps core Stripe statuses", () => {
    expect(mapStripeSubscriptionStatus("active")).toBe("active");
    expect(mapStripeSubscriptionStatus("trialing")).toBe("trialing");
    expect(mapStripeSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapStripeSubscriptionStatus("canceled")).toBe("canceled");
    expect(mapStripeSubscriptionStatus("unpaid")).toBe("unpaid");
  });

  it("maps incomplete states to unpaid", () => {
    expect(mapStripeSubscriptionStatus("incomplete")).toBe("unpaid");
    expect(mapStripeSubscriptionStatus("incomplete_expired")).toBe("unpaid");
  });
});

describe("primaryPriceIdFromSubscription", () => {
  it("reads first subscription item price id", () => {
    const sub = {
      items: { data: [{ price: { id: "price_x" } }] },
    };
    expect(primaryPriceIdFromSubscription(sub as never)).toBe("price_x");
  });

  it("handles string price reference", () => {
    const sub = { items: { data: [{ price: "price_y" }] } };
    expect(primaryPriceIdFromSubscription(sub as never)).toBe("price_y");
  });
});

describe("orgStripePatchFromSubscription", () => {
  it("derives plan from price id", () => {
    const sub = {
      id: "sub_1",
      status: "active" as const,
      items: { data: [{ price: { id: "price_pm" } }] },
    };
    expect(orgStripePatchFromSubscription(sub as never, prices)).toMatchObject({
      plan: "pro",
      stripeSubscriptionId: "sub_1",
      stripeSubscriptionStatus: "active",
      stripePriceId: "price_pm",
    });
  });
});

describe("preset patches", () => {
  it("subscription deleted resets paid fields", () => {
    expect(orgStripePatchForSubscriptionDeleted()).toMatchObject({
      plan: "free",
      stripeSubscriptionId: null,
      stripeSubscriptionStatus: "canceled",
    });
  });

  it("payment failed sets past_due", () => {
    expect(orgStripePatchForPaymentFailed()).toEqual({
      stripeSubscriptionStatus: "past_due",
    });
  });
});
