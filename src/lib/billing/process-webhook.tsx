import config from "@payload-config";
import type Stripe from "stripe";
import { createElement } from "react";
import { getPayload } from "payload";

import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { findOrgIdByStripeCustomerId } from "@/lib/billing/find-org-by-stripe-customer";
import { getOwnerEmailsForOrg } from "@/lib/billing/owner-emails";
import { resolveStripePricesFromEnv } from "@/lib/billing/plans";
import { tryClaimStripeEvent } from "@/lib/billing/stripe-idempotency";
import { stripe } from "@/lib/billing/stripe";
import {
  orgStripePatchForPaymentFailed,
  orgStripePatchForSubscriptionDeleted,
  orgStripePatchFromSubscription,
  type OrgStripePatch,
} from "@/lib/billing/webhook-handlers";
import BillingAlertEmail from "@/lib/email/templates/billing-alert";
import { sendTransactionalEmail } from "@/lib/email/send";
import { getOrganizationBillingById } from "@/lib/org/load-org";
import { appOrigin } from "@/lib/url/app-origin";
import { sendWebhookFireAndForget } from "@/lib/webhooks/send";

async function applyOrgStripePatch(organizationId: string, patch: OrgStripePatch): Promise<void> {
  const payload = await getPayload({ config });
  const data: Record<string, unknown> = {};
  if (patch.plan !== undefined) data.plan = patch.plan;
  if (patch.stripeSubscriptionId !== undefined) {
    data.stripeSubscriptionId = patch.stripeSubscriptionId;
  }
  if (patch.stripeSubscriptionStatus !== undefined) {
    data.stripeSubscriptionStatus = patch.stripeSubscriptionStatus;
  }
  if (patch.stripePriceId !== undefined) data.stripePriceId = patch.stripePriceId;
  if (Object.keys(data).length === 0) return;
  await payload.update({
    collection: "organizations",
    id: organizationId,
    data: data as never,
    overrideAccess: true,
  });
}

async function resolveOrgIdFromSubscription(sub: Stripe.Subscription): Promise<string | null> {
  const fromMeta = sub.metadata?.orgId;
  if (fromMeta) return fromMeta;
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  if (!customerId) return null;
  return findOrgIdByStripeCustomerId(customerId);
}

const STRIPE_ACTOR = {
  actorId: "stripe_webhook",
  actorEmail: null as string | null,
  actorName: "Stripe",
};

async function sendBillingAlerts(
  orgId: string,
  event: "payment_failed" | "subscription_cancelled" | "trial_ending",
  daysRemaining?: number,
): Promise<void> {
  const org = await getOrganizationBillingById(orgId);
  if (!org) return;
  const portalUrl = `${appOrigin()}/api/billing/portal?orgId=${encodeURIComponent(orgId)}`;
  const toList = await getOwnerEmailsForOrg(orgId);
  const subject =
    event === "payment_failed"
      ? `Action needed: billing for ${org.name}`
      : event === "subscription_cancelled"
        ? `Subscription cancelled — ${org.name}`
        : `Trial ending — ${org.name}`;
  for (const to of toList) {
    await sendTransactionalEmail({
      to,
      subject,
      react: createElement(BillingAlertEmail, {
        orgName: org.name,
        event,
        daysRemaining,
        portalUrl,
      }),
    });
  }
}

export async function processStripeWebhookEvent(event: Stripe.Event): Promise<void> {
  const claimed = await tryClaimStripeEvent(event.id);
  if (!claimed) return;

  const prices = resolveStripePricesFromEnv();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orgId = session.metadata?.orgId;
      if (!orgId) {
        console.error("[stripe] checkout.session.completed missing metadata.orgId");
        return;
      }
      const subRef = session.subscription;
      const subId = typeof subRef === "string" ? subRef : subRef?.id;
      if (!subId) {
        console.error("[stripe] checkout.session.completed missing subscription");
        return;
      }
      const sub = (await stripe.subscriptions.retrieve(subId)) as Stripe.Subscription;
      const patch = orgStripePatchFromSubscription(sub, prices);
      const prev = await getOrganizationBillingById(orgId);
      if (!prev) return;
      await applyOrgStripePatch(orgId, patch);
      if (patch.plan && patch.plan !== "free") {
        fireAndForgetAuditLog("billing.subscription_activated", {
          organizationId: orgId,
          ...STRIPE_ACTOR,
          resourceType: "organization",
          resourceId: orgId,
          metadata: { plan: patch.plan, stripeSubscriptionId: sub.id },
        });
        sendWebhookFireAndForget(orgId, "billing.subscription_activated", {
          orgId,
          plan: patch.plan,
        });
      }
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = await resolveOrgIdFromSubscription(sub);
      if (!orgId) {
        console.error("[stripe] customer.subscription.updated could not resolve org");
        return;
      }
      const patch = orgStripePatchFromSubscription(sub, prices);
      const prev = await getOrganizationBillingById(orgId);
      if (!prev) return;
      await applyOrgStripePatch(orgId, patch);
      if (prev.plan !== patch.plan) {
        fireAndForgetAuditLog("billing.plan_changed", {
          organizationId: orgId,
          ...STRIPE_ACTOR,
          resourceType: "organization",
          resourceId: orgId,
          metadata: { from: prev.plan, to: patch.plan ?? "free" },
        });
        sendWebhookFireAndForget(orgId, "billing.plan_changed", {
          orgId,
          from: prev.plan,
          to: patch.plan ?? "free",
        });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = await resolveOrgIdFromSubscription(sub);
      if (!orgId) return;
      await applyOrgStripePatch(orgId, orgStripePatchForSubscriptionDeleted());
      fireAndForgetAuditLog("billing.subscription_cancelled", {
        organizationId: orgId,
        ...STRIPE_ACTOR,
        resourceType: "organization",
        resourceId: orgId,
        metadata: { stripeSubscriptionId: sub.id },
      });
      sendWebhookFireAndForget(orgId, "billing.subscription_cancelled", { orgId });
      await sendBillingAlerts(orgId, "subscription_cancelled");
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId =
        typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      if (!customerId) return;
      const orgId = await findOrgIdByStripeCustomerId(customerId);
      if (!orgId) return;
      await applyOrgStripePatch(orgId, orgStripePatchForPaymentFailed());
      await sendBillingAlerts(orgId, "payment_failed");
      break;
    }

    case "customer.subscription.trial_will_end": {
      const sub = event.data.object as Stripe.Subscription;
      const orgId = await resolveOrgIdFromSubscription(sub);
      if (!orgId) return;
      const trialEnd = sub.trial_end;
      let daysRemaining: number | undefined;
      if (trialEnd) {
        const ms = trialEnd * 1000 - Date.now();
        daysRemaining = Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
      }
      await sendBillingAlerts(orgId, "trial_ending", daysRemaining);
      break;
    }

    default:
      break;
  }
}
