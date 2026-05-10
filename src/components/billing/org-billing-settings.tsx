"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cancelSubscriptionAction, resumeSubscriptionAction } from "@/lib/actions/billing";
import { UpgradeDialog, type ChangePlanCatalog } from "@/components/billing/upgrade-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { OrgBillingInvoiceRow } from "@/lib/billing/list-invoices";
import { formatInvoiceAmount } from "@/lib/billing/list-invoices";
import {
  planBillingBlurb,
  planDisplayName,
  planLimitsSummary,
  normalizePlanKey,
} from "@/lib/billing/plan-display";

function statusBadgeVariant(
  status: string | null | undefined,
): "default" | "secondary" | "destructive" | "outline" {
  if (!status) return "outline";
  if (status === "active" || status === "trialing") return "default";
  if (status === "past_due" || status === "unpaid") return "destructive";
  return "secondary";
}

function invoiceStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  if (status === "paid") return "default";
  if (status === "open" || status === "draft") return "secondary";
  if (status === "uncollectible" || status === "void") return "destructive";
  return "outline";
}

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

export function OrgBillingSettings({
  orgId,
  orgSlug,
  isOwner,
  plan,
  stripeCustomerId,
  stripeSubscriptionId,
  stripeSubscriptionStatus,
  stripePriceId,
  currentPriceDisplay,
  currentPeriodEndLabel,
  cancelAtPeriodEnd,
  changePlanCatalog,
  invoices,
}: {
  orgId: string;
  orgSlug: string;
  isOwner: boolean;
  plan: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripeSubscriptionStatus: string | null;
  stripePriceId: string | null;
  currentPriceDisplay: string | null;
  currentPeriodEndLabel: string | null;
  cancelAtPeriodEnd: boolean;
  changePlanCatalog: ChangePlanCatalog | null;
  invoices: OrgBillingInvoiceRow[];
}) {
  const router = useRouter();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [resuming, setResuming] = useState(false);

  const portalHref = `/api/billing/portal?orgId=${encodeURIComponent(orgId)}`;
  const canUsePortal = Boolean(stripeCustomerId?.trim());
  const planKey = normalizePlanKey(plan);
  const isPaidTier = planKey !== "free";

  async function onResumeSubscription() {
    setResuming(true);
    try {
      await resumeSubscriptionAction({ orgId });
      toast.success("Subscription resumed. Billing will continue as usual.");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not resume";
      if (message.startsWith("VALIDATION:")) {
        toast.error(message.replace("VALIDATION:", "").trim());
      } else {
        toast.error(message);
      }
    } finally {
      setResuming(false);
    }
  }

  async function onConfirmCancel() {
    setCancelling(true);
    try {
      await cancelSubscriptionAction({ orgId });
      toast.success("Subscription will cancel at the end of the billing period.");
      setCancelOpen(false);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not cancel";
      if (message.startsWith("VALIDATION:")) {
        toast.error(message.replace("VALIDATION:", "").trim());
      } else {
        toast.error(message);
      }
    } finally {
      setCancelling(false);
    }
  }

  const canCancelSubscription =
    isOwner &&
    Boolean(stripeSubscriptionId) &&
    stripeSubscriptionStatus &&
    stripeSubscriptionStatus !== "canceled";

  return (
    <div className="space-y-6">
      <Card className="pb-3">
        <CardHeader>
          <CardTitle>Plan</CardTitle>
          <CardDescription>
            Subscription for this organization. Limits apply to this workspace; payment methods and invoices are
            handled by Stripe.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1">
              <h2 className="text-lg font-semibold tracking-tight">{planDisplayName(plan)}</h2>
              {currentPriceDisplay ? (
                <span className="text-muted-foreground text-sm font-semibold tabular-nums tracking-tight">
                  {currentPriceDisplay}
                </span>
              ) : null}
            </div>
            {stripeSubscriptionStatus ? (
              <Badge variant={statusBadgeVariant(stripeSubscriptionStatus)} className="capitalize">
                {formatStatusLabel(stripeSubscriptionStatus)}
              </Badge>
            ) : !isPaidTier ? (
              <Badge variant="outline">No subscription</Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground text-sm leading-relaxed">{planBillingBlurb(plan)}</p>
          <p className="text-muted-foreground text-sm">{planLimitsSummary(plan)}</p>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-border [.border-t]:pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-muted-foreground min-w-0 space-y-1 text-sm">
            {!isPaidTier ? (
              <p>Upgrade when you need higher API limits, more members, or additional webhook endpoints.</p>
            ) : (
              <p>
                Upgrades apply immediately; downgrades take effect at the end of the billing period. Use Manage in
                Stripe for payment methods and invoices.
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            {isOwner && changePlanCatalog ? (
              <UpgradeDialog
                orgId={orgId}
                orgSlug={orgSlug}
                currentPlanKey={planKey}
                currentPriceId={stripePriceId}
                catalog={changePlanCatalog}
              >
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  {isPaidTier ? "Change plan" : "Choose a plan"}
                </Button>
              </UpgradeDialog>
            ) : null}
          </div>
        </CardFooter>
      </Card>

      <Card className="pb-3">
        <CardHeader>
          <CardTitle>Payment</CardTitle>
          <CardDescription>
            Update saved cards and billing details in Stripe&apos;s secure Customer Portal.
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-4 border-t border-border [.border-t]:pt-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground text-sm">
            {canUsePortal
              ? "Changes apply to future invoices for this organization."
              : "Subscribe to a paid plan to manage payment methods."}
          </p>
          {canUsePortal ? (
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" asChild>
              <Link href={portalHref} target="_blank" rel="noopener noreferrer">
                Manage in Stripe
                <ExternalLink className="size-3.5 opacity-70" aria-hidden />
              </Link>
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" className="shrink-0 gap-2" disabled>
              Manage in Stripe
            </Button>
          )}
        </CardFooter>
      </Card>

      <Card className="pb-3">
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
          <CardDescription>Receipts and statements from Stripe for this organization.</CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          {!canUsePortal ? (
            <p className="text-muted-foreground text-sm">
              Invoices will appear here after your first checkout creates a Stripe customer for this organization.
            </p>
          ) : invoices.length === 0 ? (
            <p className="text-muted-foreground text-sm">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-0">Date</TableHead>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="pr-0 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap pl-0">
                      {new Date(inv.created * 1000).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{inv.number ?? inv.id.slice(0, 14)}</TableCell>
                    <TableCell>
                      <Badge variant={invoiceStatusVariant(inv.status)} className="capitalize">
                        {formatStatusLabel(inv.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatInvoiceAmount(inv.totalCents, inv.currency)}
                    </TableCell>
                    <TableCell className="pr-0 align-middle">
                      <div className="flex flex-wrap justify-end gap-2">
                        {inv.hostedInvoiceUrl ? (
                          <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" asChild>
                            <Link href={inv.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                              View
                            </Link>
                          </Button>
                        ) : null}
                        {inv.invoicePdf ? (
                          <Button variant="ghost" size="sm" className="h-8 shrink-0 px-2" asChild>
                            <Link href={inv.invoicePdf} target="_blank" rel="noopener noreferrer">
                              PDF
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {canUsePortal && invoices.length > 0 ? (
          <CardFooter className="border-t border-border [.border-t]:pt-3">
            <p className="text-muted-foreground text-xs">
              Need more history or payment updates?{" "}
              <Link
                href={portalHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline-offset-4 hover:underline"
              >
                Open Customer Portal
              </Link>
              .
            </p>
          </CardFooter>
        ) : null}
      </Card>

      <Card className="border-destructive/40 bg-muted/30 pb-3 dark:border-destructive/50">
        <CardHeader>
          <CardTitle>Cancel subscription</CardTitle>
          {cancelAtPeriodEnd ? (
            <CardDescription>
              The workspace moves to the free plan after the current billing period ends. You can still manage
              billing in Stripe.
            </CardDescription>
          ) : (
            <CardDescription>
              Stop renewing at period end. Your team keeps paid features until the current billing period completes.
              {currentPeriodEndLabel ? (
                <>
                  {" "}
                  The current period ends on{" "}
                  <span className="text-foreground font-medium">{currentPeriodEndLabel}</span>.
                </>
              ) : null}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          {!isPaidTier ? (
            <p className="text-muted-foreground py-1 text-sm leading-relaxed">
              You&apos;re on the Free plan — there&apos;s no subscription to cancel.
            </p>
          ) : cancelAtPeriodEnd ? (
            <div className="space-y-3 py-1">
              {currentPeriodEndLabel ? (
                <div className="rounded-md border border-amber-500/35 bg-amber-500/5 px-3 py-3 text-sm text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
                  <p className="font-medium">Cancellation scheduled</p>
                  <p className="text-muted-foreground mt-1.5 dark:text-amber-100/85">
                    Paid features stay available through{" "}
                    <span className="text-foreground font-medium dark:text-amber-50">
                      {currentPeriodEndLabel}
                    </span>
                    . Resume or update payment in Stripe anytime.
                  </p>
                </div>
              ) : null}
              <p className="text-sm font-medium">
                You&apos;ve scheduled cancellation. Resume here or from Stripe if you change your mind.
              </p>
              <div className="flex flex-wrap gap-2">
                {isOwner ? (
                  <Button
                    type="button"
                    size="sm"
                    className="gap-2"
                    disabled={resuming}
                    onClick={() => void onResumeSubscription()}
                  >
                    {resuming ? (
                      <>
                        <Loader2 className="size-4 animate-spin" aria-hidden />
                        Resuming…
                      </>
                    ) : (
                      "Resume subscription"
                    )}
                  </Button>
                ) : null}
                {canUsePortal ? (
                  <Button type="button" variant="outline" size="sm" className="gap-2" asChild>
                    <Link href={portalHref} target="_blank" rel="noopener noreferrer">
                      Manage in Stripe
                    </Link>
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" className="gap-2" disabled>
                    Manage in Stripe
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4 py-1 sm:flex-row sm:items-start sm:justify-between">
              <p className="text-muted-foreground min-w-0 flex-1 text-sm leading-relaxed">
                This schedules cancel-at-period-end in Stripe. You can undo from the Customer Portal before the period
                ends.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-destructive/50 shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                disabled={!canCancelSubscription}
                onClick={() => setCancelOpen(true)}
              >
                Cancel at period end
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel at period end?</DialogTitle>
            <DialogDescription>
              Your organization keeps paid features until the end of the current billing period. You can manage
              billing or resume in Stripe&apos;s Customer Portal.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 gap-3 pt-2 sm:mt-0 sm:gap-3">
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)}>
              Keep subscription
            </Button>
            <Button type="button" variant="destructive" disabled={cancelling} onClick={onConfirmCancel}>
              {cancelling ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Confirming…
                </>
              ) : (
                "Confirm cancellation"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
