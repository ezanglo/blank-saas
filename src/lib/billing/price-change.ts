import type { StripePricesResolved } from "@/lib/billing/plans";

/** Sentinel for the Free plan row in change-plan UI (not a Stripe price id). */
export const FREE_PLAN_SELECTION_ID = "free_plan" as const;

/** Catalog order: higher index = higher tier (Pro monthly → Pro yearly → Enterprise). */
export function priceTierIndex(priceId: string, catalog: StripePricesResolved): number {
  const order = [catalog.pro.monthly, catalog.pro.yearly, catalog.enterprise.monthly];
  return order.indexOf(priceId);
}

export type PriceChangeKind = "upgrade" | "downgrade" | "same";

/**
 * Compares current subscription price to a target catalog price (or {@link FREE_PLAN_SELECTION_ID}).
 * Unknown / legacy `currentPriceId` values are treated as `"upgrade"` when targeting a paid price.
 */
export function priceChangeKind(
  currentPriceId: string | null | undefined,
  targetPriceId: string,
  catalog: StripePricesResolved,
): PriceChangeKind {
  if (targetPriceId === FREE_PLAN_SELECTION_ID) {
    return currentPriceId?.trim() ? "downgrade" : "same";
  }
  if (!currentPriceId?.trim()) return "upgrade";
  const from = priceTierIndex(currentPriceId, catalog);
  const to = priceTierIndex(targetPriceId, catalog);
  if (from < 0 || to < 0) return "upgrade";
  if (to > from) return "upgrade";
  if (to < from) return "downgrade";
  return "same";
}
