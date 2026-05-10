/** Format a Stripe Price for UI (uses `unit_amount` cents + `recurring.interval`). */
export function formatStripePriceDisplay(price: {
  unit_amount: number | null;
  currency: string;
  recurring?: { interval?: string; interval_count?: number | null } | null;
}): string {
  const cents = price.unit_amount;
  const currency = (price.currency ?? "usd").toUpperCase();
  if (cents == null) {
    return "—";
  }
  const formatted = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
  }).format(cents / 100);

  const rec = price.recurring;
  if (!rec?.interval) {
    return formatted;
  }

  const count = rec.interval_count ?? 1;
  const interval = rec.interval;
  if (count === 1) {
    if (interval === "month") return `${formatted}/mo`;
    if (interval === "year") return `${formatted}/yr`;
    if (interval === "week") return `${formatted}/wk`;
    if (interval === "day") return `${formatted}/day`;
  }
  return `${formatted} / ${count} ${interval}s`;
}
