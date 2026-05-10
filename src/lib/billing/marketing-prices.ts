import { formatStripePriceDisplay } from "@/lib/billing/format-stripe-price";
import { resolveStripePricesFromEnv } from "@/lib/billing/plans";
import { requireStripeSecretKey, stripe } from "@/lib/billing/stripe";

export type MarketingPriceDisplays = {
  proMonthly: string;
  proYearly: string;
  enterpriseMonthly: string;
  /** True when values came from Stripe; false when using static fallbacks. */
  fromStripe: boolean;
};

const FALLBACK: MarketingPriceDisplays = {
  proMonthly: "$29/mo",
  proYearly: "$290/yr",
  enterpriseMonthly: "Custom",
  fromStripe: false,
};

function displayFromStripePrice(p: {
  unit_amount: number | null;
  currency: string;
  recurring: { interval?: string; interval_count?: number | null } | null;
}): string {
  return formatStripePriceDisplay({
    unit_amount: typeof p.unit_amount === "number" ? p.unit_amount : null,
    currency: p.currency ?? "usd",
    recurring: p.recurring
      ? {
          interval: p.recurring.interval,
          interval_count: p.recurring.interval_count,
        }
      : null,
  });
}

/**
 * Loads catalog prices for marketing surfaces (same Price objects as checkout).
 * Falls back to placeholder strings when env or Stripe is unavailable.
 */
export async function getMarketingPriceDisplays(): Promise<MarketingPriceDisplays> {
  try {
    const ids = resolveStripePricesFromEnv();
    requireStripeSecretKey();
    const [proMonthly, proYearly, enterpriseMonthly] = await Promise.all([
      stripe.prices.retrieve(ids.pro.monthly),
      stripe.prices.retrieve(ids.pro.yearly),
      stripe.prices.retrieve(ids.enterprise.monthly),
    ]);
    return {
      proMonthly: displayFromStripePrice(proMonthly),
      proYearly: displayFromStripePrice(proYearly),
      enterpriseMonthly: displayFromStripePrice(enterpriseMonthly),
      fromStripe: true,
    };
  } catch {
    return FALLBACK;
  }
}
