import Stripe from "stripe";

/**
 * Placeholder key so the SDK can load at build time and for `webhooks.constructEvent`
 * when `STRIPE_SECRET_KEY` is unset. Real Stripe API calls must use `requireStripeSecretKey()`.
 */
const PLACEHOLDER_KEY = "sk_test_00000000000000000000000000000000";

function stripeKeyOrPlaceholder(): string {
  const k = process.env.STRIPE_SECRET_KEY?.trim();
  return k || PLACEHOLDER_KEY;
}

export const stripe = new Stripe(stripeKeyOrPlaceholder(), {
  apiVersion: Stripe.API_VERSION,
  typescript: true,
});

export function requireStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return key;
}
