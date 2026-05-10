"use server";

import { headers } from "next/headers";
import type Stripe from "stripe";

import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { clientIpFromHeaders, userAgentFromHeaders } from "@/lib/audit/request-context";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError, requireOrgRole } from "@/lib/auth/require-org";
import { createBillingPortalSessionUrl } from "@/lib/billing/portal";
import { listAllowedPriceIds, resolveStripePricesFromEnv } from "@/lib/billing/plans";
import { priceChangeKind } from "@/lib/billing/price-change";
import { requireStripeSecretKey, stripe } from "@/lib/billing/stripe";
import {
  releaseSubscriptionScheduleIfPresent,
  scheduleSubscriptionDowngradeAtPeriodEnd,
} from "@/lib/billing/subscription-schedule";
import { subscriptionCancelAtPeriodEnd } from "@/lib/billing/subscription-period";
import { orgStripePatchFromSubscription } from "@/lib/billing/webhook-handlers";
import { getOrganizationBillingById } from "@/lib/org/load-org";
import { sendWebhookFireAndForget } from "@/lib/webhooks/send";
import config from "@payload-config";
import { getPayload } from "payload";

function notifyCheckoutStarted(orgId: string, priceId: string): void {
  sendWebhookFireAndForget(orgId, "billing.checkout_started", { orgId, priceId });
}

function subscriptionCanSwapPriceOnPortal(status: Stripe.Subscription.Status): boolean {
  return status !== "canceled" && status !== "incomplete_expired";
}

async function syncOrganizationFromStripeSubscription(
  organizationId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const prices = resolveStripePricesFromEnv();
  const patch = orgStripePatchFromSubscription(sub, prices);
  const payload = await getPayload({ config });
  await payload.update({
    collection: "organizations",
    id: organizationId,
    data: {
      plan: patch.plan,
      stripeSubscriptionId: patch.stripeSubscriptionId ?? undefined,
      stripeSubscriptionStatus: patch.stripeSubscriptionStatus ?? undefined,
      stripePriceId: patch.stripePriceId ?? undefined,
    } as never,
    overrideAccess: true,
  });
}

export type CreateCheckoutSessionResult =
  | { flow: "checkout"; url: string }
  | { flow: "subscription_updated" }
  | { flow: "downgrade_scheduled"; periodEndUnix: number };

async function persistStripeCustomerId(organizationId: string, stripeCustomerId: string) {
  const payload = await getPayload({ config });
  await payload.update({
    collection: "organizations",
    id: organizationId,
    data: { stripeCustomerId },
    overrideAccess: true,
  });
}

export async function createCheckoutSessionAction(input: {
  orgId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<CreateCheckoutSessionResult> {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  await requireOrgRole({
    organizationId: input.orgId,
    userId: session.user.id,
    min: "owner",
  });

  requireStripeSecretKey();
  const prices = resolveStripePricesFromEnv();
  const allowed = listAllowedPriceIds(prices);
  if (!allowed.has(input.priceId)) {
    throw new Error("VALIDATION: Invalid price selection.");
  }

  const org = await getOrganizationBillingById(input.orgId);
  if (!org) throw new Error("Organization not found.");

  let customerId = org.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      name: org.name,
      metadata: { orgId: input.orgId },
    });
    customerId = customer.id;
    await persistStripeCustomerId(input.orgId, customerId);
  }

  const existingSubId = org.stripeSubscriptionId?.trim();
  let existingSub: Stripe.Subscription | null = null;
  if (existingSubId) {
    try {
      existingSub = await stripe.subscriptions.retrieve(existingSubId);
    } catch {
      existingSub = null;
    }
  }

  if (existingSub && subscriptionCanSwapPriceOnPortal(existingSub.status)) {
    const item = existingSub.items?.data?.[0];
    const currentPriceId =
      item?.price && (typeof item.price === "string" ? item.price : item.price.id);
    if (!item?.id || !currentPriceId) {
      throw new Error(
        "VALIDATION: This subscription cannot be changed here. Use Manage in Stripe or contact support.",
      );
    }
    if (currentPriceId === input.priceId) {
      throw new Error("VALIDATION: Already on this plan.");
    }

    const meta: Record<string, string> = {};
    if (existingSub.metadata) {
      for (const [k, v] of Object.entries(existingSub.metadata)) {
        if (v != null && v !== "") meta[k] = v;
      }
    }
    meta.orgId = input.orgId;

    const change = priceChangeKind(currentPriceId, input.priceId, prices);

    if (change === "upgrade") {
      await releaseSubscriptionScheduleIfPresent(existingSub.id);
      const subFresh = await stripe.subscriptions.retrieve(existingSub.id);
      const itemFresh = subFresh.items?.data?.[0];
      if (!itemFresh?.id) {
        throw new Error("VALIDATION: Subscription has no updatable items.");
      }

      const updated = await stripe.subscriptions.update(subFresh.id, {
        items: [{ id: itemFresh.id, price: input.priceId }],
        metadata: meta,
        proration_behavior: "create_prorations",
      });

      await syncOrganizationFromStripeSubscription(input.orgId, updated);
    } else {
      const { periodEndUnix } = await scheduleSubscriptionDowngradeAtPeriodEnd({
        subscriptionId: existingSub.id,
        currentPriceId,
        newPriceId: input.priceId,
        phaseMetadata: meta,
      });

      fireAndForgetAuditLog("billing.checkout_started", {
        organizationId: input.orgId,
        actorId: session.user.id,
        actorEmail: session.user.email,
        actorName: session.user.name,
        resourceType: "organization",
        resourceId: input.orgId,
        metadata: { priceId: input.priceId },
        ipAddress: clientIpFromHeaders(h),
        userAgent: userAgentFromHeaders(h),
      });
      notifyCheckoutStarted(input.orgId, input.priceId);

      return { flow: "downgrade_scheduled", periodEndUnix };
    }

    fireAndForgetAuditLog("billing.checkout_started", {
      organizationId: input.orgId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      resourceType: "organization",
      resourceId: input.orgId,
      metadata: { priceId: input.priceId },
      ipAddress: clientIpFromHeaders(h),
      userAgent: userAgentFromHeaders(h),
    });
    notifyCheckoutStarted(input.orgId, input.priceId);

    return { flow: "subscription_updated" };
  }

  const checkout = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { orgId: input.orgId },
    subscription_data: {
      metadata: { orgId: input.orgId },
    },
  });

  fireAndForgetAuditLog("billing.checkout_started", {
    organizationId: input.orgId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "organization",
    resourceId: input.orgId,
    metadata: { priceId: input.priceId },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });
  notifyCheckoutStarted(input.orgId, input.priceId);

  if (!checkout.url) {
    throw new Error("Checkout did not return a URL.");
  }
  return { flow: "checkout", url: checkout.url };
}

export async function createPortalSessionAction(input: { orgId: string }) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  await requireOrgRole({
    organizationId: input.orgId,
    userId: session.user.id,
    min: "admin",
  });

  const org = await getOrganizationBillingById(input.orgId);
  if (!org) throw new Error("Organization not found.");

  const url = await createBillingPortalSessionUrl({
    organizationId: input.orgId,
  });
  return { url };
}

export async function resumeSubscriptionAction(input: { orgId: string }) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  await requireOrgRole({
    organizationId: input.orgId,
    userId: session.user.id,
    min: "owner",
  });

  requireStripeSecretKey();

  const org = await getOrganizationBillingById(input.orgId);
  if (!org?.stripeSubscriptionId) {
    throw new Error("VALIDATION: No subscription to resume.");
  }

  const sub = await stripe.subscriptions.retrieve(org.stripeSubscriptionId);
  if (!subscriptionCancelAtPeriodEnd(sub)) {
    throw new Error("VALIDATION: This subscription is not scheduled for cancellation.");
  }

  await releaseSubscriptionScheduleIfPresent(org.stripeSubscriptionId);

  await stripe.subscriptions.update(org.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  fireAndForgetAuditLog("billing.subscription_resumed", {
    organizationId: input.orgId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "organization",
    resourceId: input.orgId,
    metadata: { stripeSubscriptionId: org.stripeSubscriptionId },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  sendWebhookFireAndForget(input.orgId, "billing.subscription_resumed", {
    orgId: input.orgId,
    stripeSubscriptionId: org.stripeSubscriptionId,
  });
}

export async function cancelSubscriptionAction(input: { orgId: string }) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  await requireOrgRole({
    organizationId: input.orgId,
    userId: session.user.id,
    min: "owner",
  });

  requireStripeSecretKey();

  const org = await getOrganizationBillingById(input.orgId);
  if (!org?.stripeSubscriptionId) {
    throw new Error("VALIDATION: No active subscription to cancel.");
  }

  await stripe.subscriptions.update(org.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  fireAndForgetAuditLog("billing.subscription_cancelled", {
    organizationId: input.orgId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "organization",
    resourceId: input.orgId,
    metadata: { stripeSubscriptionId: org.stripeSubscriptionId },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });
}
