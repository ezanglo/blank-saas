/** Current billing period end (Unix seconds) from a Subscription — uses first line item (Stripe Billing 2026+). */
export function subscriptionCurrentPeriodEndUnix(sub: {
  items?: { data?: Array<{ current_period_end?: number }> };
}): number | null {
  const end = sub.items?.data?.[0]?.current_period_end;
  return typeof end === "number" ? end : null;
}

/** Current billing period start (Unix seconds) from the first subscription line item. */
export function subscriptionCurrentPeriodStartUnix(sub: {
  items?: { data?: Array<{ current_period_start?: number }> };
}): number | null {
  const start = sub.items?.data?.[0]?.current_period_start;
  return typeof start === "number" ? start : null;
}

/** Stripe returns `cancel_at_period_end` on subscription objects (field name stable across API versions). */
export function subscriptionCancelAtPeriodEnd(sub: unknown): boolean {
  if (!sub || typeof sub !== "object") return false;
  return Boolean((sub as { cancel_at_period_end?: boolean }).cancel_at_period_end);
}
