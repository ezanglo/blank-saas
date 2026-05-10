import type { PlanKey } from "@/lib/quota/plans";

export type BillingInterval = "monthly" | "yearly";

export type StripePricesResolved = {
  pro: { monthly: string; yearly: string };
  enterprise: { monthly: string };
};

/**
 * Reads price IDs from env. Throws if any required key is missing or empty.
 */
export function resolveStripePricesFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): StripePricesResolved {
  const proMonthly = env.STRIPE_PRICE_PRO_MONTHLY?.trim();
  const proYearly = env.STRIPE_PRICE_PRO_YEARLY?.trim();
  const enterpriseMonthly = env.STRIPE_PRICE_ENTERPRISE_MONTHLY?.trim();
  if (!proMonthly || !proYearly || !enterpriseMonthly) {
    throw new Error(
      "Missing STRIPE_PRICE_* environment variables (PRO_MONTHLY, PRO_YEARLY, ENTERPRISE_MONTHLY required)",
    );
  }
  return {
    pro: { monthly: proMonthly, yearly: proYearly },
    enterprise: { monthly: enterpriseMonthly },
  };
}

/** Same as `resolveStripePricesFromEnv` but returns null when vars are missing (e.g. misconfigured worker). */
export function tryResolveStripePricesFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): StripePricesResolved | null {
  const proMonthly = env.STRIPE_PRICE_PRO_MONTHLY?.trim();
  const proYearly = env.STRIPE_PRICE_PRO_YEARLY?.trim();
  const enterpriseMonthly = env.STRIPE_PRICE_ENTERPRISE_MONTHLY?.trim();
  if (!proMonthly || !proYearly || !enterpriseMonthly) return null;
  return {
    pro: { monthly: proMonthly, yearly: proYearly },
    enterprise: { monthly: enterpriseMonthly },
  };
}

/** All purchasable price IDs (for checkout validation). */
export function listAllowedPriceIds(prices: StripePricesResolved): Set<string> {
  return new Set([
    prices.pro.monthly,
    prices.pro.yearly,
    prices.enterprise.monthly,
  ]);
}

export function planFromPriceId(priceId: string, prices: StripePricesResolved): PlanKey {
  if (priceId === prices.pro.monthly || priceId === prices.pro.yearly) return "pro";
  if (priceId === prices.enterprise.monthly) return "enterprise";
  return "free";
}
