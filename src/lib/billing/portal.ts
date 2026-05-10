import { requireStripeSecretKey, stripe } from "@/lib/billing/stripe";
import { getOrganizationBillingById } from "@/lib/org/load-org";
import { appOrigin } from "@/lib/url/app-origin";

export async function createBillingPortalSessionUrl(params: {
  organizationId: string;
}): Promise<string> {
  requireStripeSecretKey();
  const org = await getOrganizationBillingById(params.organizationId);
  if (!org?.stripeCustomerId) {
    throw new Error("No billing account found.");
  }
  const returnUrl = `${appOrigin()}/organizations/${org.slug}/settings/billing`;
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  });
  if (!session.url) {
    throw new Error("Stripe Customer Portal did not return a URL.");
  }
  return session.url;
}
