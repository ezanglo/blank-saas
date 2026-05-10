import type Stripe from "stripe";

import type { PlanKey } from "@/lib/quota/plans";

import { type StripePricesResolved, planFromPriceId } from "@/lib/billing/plans";

/** Fields we sync from Stripe onto `organizations`. */
export type OrgStripePatch = {
  plan?: PlanKey;
  stripeSubscriptionId?: string | null;
  stripeSubscriptionStatus?:
    | "active"
    | "trialing"
    | "past_due"
    | "canceled"
    | "unpaid"
    | null;
  stripePriceId?: string | null;
};

export function primaryPriceIdFromSubscription(sub: Stripe.Subscription): string | null {
  const item = sub.items?.data?.[0];
  const p = item?.price;
  if (!p) return null;
  return typeof p === "string" ? p : p.id;
}

export function mapStripeSubscriptionStatus(
  status: Stripe.Subscription.Status,
): NonNullable<OrgStripePatch["stripeSubscriptionStatus"]> {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
      return "canceled";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
      return "unpaid";
    case "paused":
      return "active";
    default:
      return "unpaid";
  }
}

export function orgStripePatchFromSubscription(
  sub: Stripe.Subscription,
  prices: StripePricesResolved,
): OrgStripePatch {
  const priceId = primaryPriceIdFromSubscription(sub);
  const plan = priceId ? planFromPriceId(priceId, prices) : ("free" as const);
  return {
    plan,
    stripeSubscriptionId: sub.id,
    stripeSubscriptionStatus: mapStripeSubscriptionStatus(sub.status),
    stripePriceId: priceId,
  };
}

export function orgStripePatchForSubscriptionDeleted(): OrgStripePatch {
  return {
    plan: "free",
    stripeSubscriptionId: null,
    stripeSubscriptionStatus: "canceled",
    stripePriceId: null,
  };
}

export function orgStripePatchForPaymentFailed(): Pick<
  OrgStripePatch,
  "stripeSubscriptionStatus"
> {
  return { stripeSubscriptionStatus: "past_due" };
}
