import type Stripe from "stripe";

import { stripe } from "@/lib/billing/stripe";
import {
  subscriptionCurrentPeriodEndUnix,
  subscriptionCurrentPeriodStartUnix,
} from "@/lib/billing/subscription-period";

export function subscriptionScheduleId(sub: Stripe.Subscription): string | null {
  const s = sub.schedule;
  if (typeof s === "string") return s;
  if (s && typeof s === "object" && "id" in s && typeof s.id === "string") return s.id;
  return null;
}

/** Stops a subscription schedule; the subscription keeps billing without scheduled phase changes. */
export async function releaseSubscriptionScheduleIfPresent(
  subscriptionId: string,
): Promise<void> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const sid = subscriptionScheduleId(sub);
  if (!sid) return;
  await stripe.subscriptionSchedules.release(sid);
}

/**
 * After the current period ends, the subscription moves to `newPriceId`.
 * Uses Subscription Schedules (two phases). Does not change the org's effective plan until Stripe applies the phase.
 */
export async function scheduleSubscriptionDowngradeAtPeriodEnd(params: {
  subscriptionId: string;
  currentPriceId: string;
  newPriceId: string;
  phaseMetadata: Record<string, string>;
}): Promise<{ periodEndUnix: number }> {
  const { subscriptionId, currentPriceId, newPriceId, phaseMetadata } = params;

  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const periodStart = subscriptionCurrentPeriodStartUnix(sub);
  const periodEnd = subscriptionCurrentPeriodEndUnix(sub);
  if (periodStart == null || periodEnd == null) {
    throw new Error("VALIDATION: Could not read subscription billing period.");
  }

  let scheduleId = subscriptionScheduleId(sub);
  if (!scheduleId) {
    const created = await stripe.subscriptionSchedules.create({
      from_subscription: subscriptionId,
    });
    scheduleId = created.id;
  }

  const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId);
  const phase0Start = schedule.phases[0]?.start_date ?? periodStart;
  const phase0End = periodEnd;

  await stripe.subscriptionSchedules.update(scheduleId, {
    end_behavior: "release",
    phases: [
      {
        start_date: phase0Start,
        end_date: phase0End,
        items: [{ price: currentPriceId, quantity: 1 }],
        metadata: phaseMetadata,
      },
      {
        start_date: phase0End,
        items: [{ price: newPriceId, quantity: 1 }],
        metadata: phaseMetadata,
        proration_behavior: "none",
      },
    ],
  });

  return { periodEndUnix: periodEnd };
}
