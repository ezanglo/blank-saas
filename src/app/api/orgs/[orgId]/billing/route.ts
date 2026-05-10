import { NextResponse } from "next/server";

import { requireStripeSecretKey, stripe } from "@/lib/billing/stripe";
import { subscriptionCurrentPeriodEndUnix } from "@/lib/billing/subscription-period";
import { requireOrgMemberSession } from "@/lib/auth/require-org-api";
import { getOrganizationBillingById } from "@/lib/org/load-org";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await ctx.params;
  const gate = await requireOrgMemberSession(orgId);
  if (!gate.ok) return gate.response;

  const row = await getOrganizationBillingById(orgId);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let currentPeriodEnd: number | null = null;
  try {
    if (row.stripeSubscriptionId) {
      requireStripeSecretKey();
      const sub = await stripe.subscriptions.retrieve(row.stripeSubscriptionId);
      currentPeriodEnd = subscriptionCurrentPeriodEndUnix(sub);
    }
  } catch {
    currentPeriodEnd = null;
  }

  return NextResponse.json({
    plan: row.plan,
    stripeSubscriptionStatus: row.stripeSubscriptionStatus,
    stripePriceId: row.stripePriceId,
    currentPeriodEnd,
  });
}
