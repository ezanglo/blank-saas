import { requireStripeSecretKey, stripe } from "@/lib/billing/stripe";

export type OrgBillingInvoiceRow = {
  id: string;
  number: string | null;
  status: string;
  totalCents: number;
  currency: string;
  created: number;
  hostedInvoiceUrl: string | null;
  invoicePdf: string | null;
};

const DEFAULT_LIMIT = 24;

/** Lists recent finalized/open invoices for a Stripe customer (server-only; uses `STRIPE_SECRET_KEY`). */
export async function listInvoicesForOrgCustomer(
  stripeCustomerId: string,
  limit = DEFAULT_LIMIT,
): Promise<OrgBillingInvoiceRow[]> {
  requireStripeSecretKey();
  const res = await stripe.invoices.list({
    customer: stripeCustomerId,
    limit,
  });

  return res.data.map((inv) => ({
    id: inv.id,
    number: inv.number ?? null,
    status: inv.status ?? "unknown",
    totalCents: typeof inv.total === "number" ? inv.total : 0,
    currency: inv.currency ?? "usd",
    created: inv.created,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdf: inv.invoice_pdf ?? null,
  }));
}

export function formatInvoiceAmount(cents: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(cents / 100);
  } catch {
    return `${currency.toUpperCase()} ${(cents / 100).toFixed(2)}`;
  }
}
