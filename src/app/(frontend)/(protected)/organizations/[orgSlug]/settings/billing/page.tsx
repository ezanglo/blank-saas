import { redirect } from "next/navigation";

import { OrgBillingSettings } from "@/components/billing/org-billing-settings";
import type { ChangePlanCatalog } from "@/components/billing/upgrade-dialog";
import { roleAtLeast } from "@/lib/auth/rbac";
import {
  listInvoicesForOrgCustomer,
  type OrgBillingInvoiceRow,
} from "@/lib/billing/list-invoices";
import { formatStripePriceDisplay } from "@/lib/billing/format-stripe-price";
import { planBillingBlurb } from "@/lib/billing/plan-display";
import { FREE_PLAN_SELECTION_ID, priceChangeKind } from "@/lib/billing/price-change";
import { resolveStripePricesFromEnv } from "@/lib/billing/plans";
import { requireStripeSecretKey, stripe } from "@/lib/billing/stripe";
import {
  subscriptionCancelAtPeriodEnd,
  subscriptionCurrentPeriodEndUnix,
} from "@/lib/billing/subscription-period";
import { getOrganizationBillingById } from "@/lib/org/load-org";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsBillingPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org, role } = await requireOrgContextForSlug(orgSlug);

  if (!roleAtLeast(role, "admin")) {
    redirect("/organizations?error=forbidden");
  }

  const billing = await getOrganizationBillingById(org.id);
  if (!billing) {
    redirect("/organizations?error=forbidden");
  }

  let currentPeriodEndLabel: string | null = null;
  let cancelAtPeriodEnd = false;
  try {
    if (billing.stripeSubscriptionId) {
      requireStripeSecretKey();
      const sub = await stripe.subscriptions.retrieve(billing.stripeSubscriptionId);
      const periodEnd = subscriptionCurrentPeriodEndUnix(sub);
      cancelAtPeriodEnd = subscriptionCancelAtPeriodEnd(sub);
      if (periodEnd) {
        currentPeriodEndLabel = new Date(periodEnd * 1000).toLocaleDateString(
          undefined,
          { dateStyle: "medium" },
        );
      }
    }
  } catch {
    currentPeriodEndLabel = null;
    cancelAtPeriodEnd = false;
  }

  let changePlanCatalog: ChangePlanCatalog | null = null;
  try {
    const prices = resolveStripePricesFromEnv();
    requireStripeSecretKey();
    const [proMonthly, proYearly, entMonthly] = await Promise.all([
      stripe.prices.retrieve(prices.pro.monthly),
      stripe.prices.retrieve(prices.pro.yearly),
      stripe.prices.retrieve(prices.enterprise.monthly),
    ]);
    const asDisplay = (p: typeof proMonthly) =>
      formatStripePriceDisplay({
        unit_amount: typeof p.unit_amount === "number" ? p.unit_amount : null,
        currency: p.currency ?? "usd",
        recurring: p.recurring
          ? {
              interval: p.recurring.interval,
              interval_count: p.recurring.interval_count,
            }
          : null,
      });
    const currentPid = billing.stripePriceId?.trim() ?? null;
    const changeFor = (stripePriceId: string) => {
      const k = priceChangeKind(currentPid, stripePriceId, prices);
      return k === "same" ? null : k;
    };
    const freeKind = priceChangeKind(currentPid, FREE_PLAN_SELECTION_ID, prices);
    changePlanCatalog = {
      free: {
        id: FREE_PLAN_SELECTION_ID,
        label: "Free",
        description: planBillingBlurb("free"),
        priceDisplay: "$0",
        changeKind: freeKind === "same" ? null : freeKind,
      },
      proMonthly: {
        id: prices.pro.monthly,
        label: "Pro",
        description: "For growing teams that need higher limits.",
        priceDisplay: asDisplay(proMonthly),
        changeKind: changeFor(prices.pro.monthly),
      },
      proYearly: {
        id: prices.pro.yearly,
        label: "Pro",
        description: "Best value for teams committed annually.",
        priceDisplay: asDisplay(proYearly),
        changeKind: changeFor(prices.pro.yearly),
      },
      enterpriseMonthly: {
        id: prices.enterprise.monthly,
        label: "Enterprise",
        description: "Unlimited-scale limits for large organizations.",
        priceDisplay: asDisplay(entMonthly),
        changeKind: changeFor(prices.enterprise.monthly),
      },
    };
  } catch {
    changePlanCatalog = null;
  }

  let currentPriceDisplay: string | null = null;
  const priceId = billing.stripePriceId?.trim() ?? null;
  if (priceId && changePlanCatalog) {
    const paid = [
      changePlanCatalog.proMonthly,
      changePlanCatalog.proYearly,
      changePlanCatalog.enterpriseMonthly,
    ];
    currentPriceDisplay = paid.find((o) => o.id === priceId)?.priceDisplay ?? null;
  }
  if (priceId && !currentPriceDisplay) {
    try {
      requireStripeSecretKey();
      const p = await stripe.prices.retrieve(priceId);
      currentPriceDisplay = formatStripePriceDisplay({
        unit_amount: typeof p.unit_amount === "number" ? p.unit_amount : null,
        currency: p.currency ?? "usd",
        recurring: p.recurring
          ? {
              interval: p.recurring.interval,
              interval_count: p.recurring.interval_count,
            }
          : null,
      });
    } catch {
      currentPriceDisplay = null;
    }
  }

  let invoices: OrgBillingInvoiceRow[] = [];
  try {
    const customerId = billing.stripeCustomerId?.trim();
    if (customerId) {
      invoices = await listInvoicesForOrgCustomer(customerId);
    }
  } catch (err) {
    console.error("[billing] list invoices", err);
    invoices = [];
  }

  const isOwner = role === "owner";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          Plans, payment methods, and invoices for this organization. Owners can start checkout or schedule
          cancellation; admins can open the Customer Portal.
        </p>
      </div>
      <OrgBillingSettings
        orgId={org.id}
        orgSlug={org.slug}
        isOwner={isOwner}
        plan={billing.plan}
        stripeCustomerId={billing.stripeCustomerId ?? null}
        stripeSubscriptionId={billing.stripeSubscriptionId ?? null}
        stripeSubscriptionStatus={billing.stripeSubscriptionStatus ?? null}
        stripePriceId={billing.stripePriceId ?? null}
        currentPriceDisplay={currentPriceDisplay}
        currentPeriodEndLabel={currentPeriodEndLabel}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        changePlanCatalog={isOwner ? changePlanCatalog : null}
        invoices={invoices}
      />
    </div>
  );
}
