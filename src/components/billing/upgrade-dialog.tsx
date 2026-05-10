"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { cancelSubscriptionAction, createCheckoutSessionAction } from "@/lib/actions/billing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FREE_PLAN_SELECTION_ID } from "@/lib/billing/price-change";
import type { PlanKey } from "@/lib/quota/plans";
import { cn } from "@/lib/utils";

export type ChangePlanRow = {
  id: string;
  label: string;
  description: string;
  priceDisplay: string;
  changeKind: "upgrade" | "downgrade" | null;
};

export type ChangePlanCatalog = {
  free: ChangePlanRow;
  proMonthly: ChangePlanRow;
  proYearly: ChangePlanRow;
  enterpriseMonthly: ChangePlanRow;
};

function PlanRowButton({
  row,
  loading,
  selectedId,
  onSelectRow,
  isRowCurrent,
}: {
  row: ChangePlanRow;
  loading: boolean;
  selectedId: string | null;
  onSelectRow: (id: string) => void;
  isRowCurrent: (id: string) => boolean;
}) {
  const isCurrent = isRowCurrent(row.id);
  const isSelected = selectedId === row.id && !isCurrent;

  return (
    <button
      type="button"
      disabled={loading || isCurrent}
      onClick={() => {
        if (!isCurrent) onSelectRow(row.id);
      }}
      className={cn(
        "w-full rounded-md border px-3 py-3 text-left transition-colors",
        isCurrent &&
          "border-muted bg-muted/40 text-muted-foreground cursor-not-allowed shadow-none",
        !isCurrent && isSelected && "border-primary bg-primary/5",
        !isCurrent && !isSelected && "hover:bg-muted/40",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className={cn("font-medium", isCurrent && "text-foreground/80")}>{row.label}</p>
            {isCurrent ? (
              <Badge variant="secondary" className="font-normal shrink-0">
                Current plan
              </Badge>
            ) : row.changeKind === "upgrade" ? (
              <Badge className="shrink-0 font-normal">Upgrade</Badge>
            ) : row.changeKind === "downgrade" ? (
              <Badge variant="outline" className="shrink-0 font-normal">
                Downgrade
              </Badge>
            ) : null}
          </div>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{row.description}</p>
        </div>
        <p
          className={cn(
            "shrink-0 text-right text-sm font-semibold tabular-nums tracking-tight",
            isCurrent ? "text-muted-foreground" : "text-foreground",
          )}
        >
          {row.priceDisplay}
        </p>
      </div>
    </button>
  );
}

export function UpgradeDialog({
  orgId,
  orgSlug,
  currentPlanKey,
  currentPriceId,
  catalog,
  children,
}: {
  orgId: string;
  orgSlug: string;
  currentPlanKey: PlanKey;
  currentPriceId: string | null | undefined;
  catalog: ChangePlanCatalog;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const initRef = useRef(false);

  const isRowCurrent = (rowId: string) => {
    if (rowId === FREE_PLAN_SELECTION_ID) return currentPlanKey === "free";
    return Boolean(currentPriceId && rowId === currentPriceId);
  };

  const pickDefaultSelection = useCallback(
    (forInterval: "monthly" | "yearly"): string | null => {
      const isCur = (rowId: string) => {
        if (rowId === FREE_PLAN_SELECTION_ID) return currentPlanKey === "free";
        return Boolean(currentPriceId && rowId === currentPriceId);
      };
      const order =
        forInterval === "monthly"
          ? [catalog.free.id, catalog.proMonthly.id, catalog.enterpriseMonthly.id]
          : [catalog.free.id, catalog.proYearly.id];
      for (const id of order) {
        if (!isCur(id)) return id;
      }
      return catalog.proYearly.id;
    },
    [catalog, currentPlanKey, currentPriceId],
  );

  useEffect(() => {
    if (!open) {
      initRef.current = false;
      return;
    }
    if (initRef.current) return;
    initRef.current = true;
    setInterval("monthly");
    setSelectedId(pickDefaultSelection("monthly"));
  }, [open, pickDefaultSelection]);

  function onIntervalChange(next: "monthly" | "yearly") {
    setInterval(next);
    setSelectedId((prev) => {
      if (next === "yearly") {
        if (prev === catalog.proMonthly.id) {
          return isRowCurrent(catalog.proYearly.id) ? pickDefaultSelection("yearly") : catalog.proYearly.id;
        }
        if (prev === catalog.enterpriseMonthly.id) {
          return isRowCurrent(catalog.proYearly.id) ? pickDefaultSelection("yearly") : catalog.proYearly.id;
        }
        return prev;
      }
      if (prev === catalog.proYearly.id) {
        return isRowCurrent(catalog.proMonthly.id) ? pickDefaultSelection("monthly") : catalog.proMonthly.id;
      }
      return prev;
    });
  }

  async function onContinue() {
    if (!selectedId || isRowCurrent(selectedId)) return;
    setLoading(true);
    try {
      if (selectedId === FREE_PLAN_SELECTION_ID) {
        await cancelSubscriptionAction({ orgId });
        toast.success(
          "You'll move to the Free plan at the end of this billing period. Paid features stay until then.",
        );
        setOpen(false);
        router.refresh();
        setLoading(false);
        return;
      }

      const origin = window.location.origin;
      const base = `${origin}/organizations/${orgSlug}/settings/billing`;
      const result = await createCheckoutSessionAction({
        orgId,
        priceId: selectedId,
        successUrl: `${base}?checkout=success`,
        cancelUrl: `${base}?checkout=cancel`,
      });
      if (result.flow === "downgrade_scheduled") {
        const when = new Date(result.periodEndUnix * 1000).toLocaleDateString(undefined, {
          dateStyle: "medium",
        });
        toast.success(
          `Your plan will change on ${when}. You keep your current price and features until the end of this billing period.`,
        );
        setOpen(false);
        router.refresh();
        setLoading(false);
        return;
      }
      if (result.flow === "subscription_updated") {
        toast.success("Plan upgraded. Your subscription has been updated.");
        setOpen(false);
        router.refresh();
        setLoading(false);
        return;
      }
      const win = window.open(result.url, "_blank", "noopener,noreferrer");
      if (!win) {
        toast.error("Pop-up blocked. Allow pop-ups for this site to open Stripe Checkout.");
        setLoading(false);
        return;
      }
      setOpen(false);
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Checkout failed";
      if (
        message === "UNAUTHORIZED" ||
        message.includes("Not signed in") ||
        message === "Forbidden"
      ) {
        toast.error("You do not have permission to change billing.");
      } else if (message.startsWith("VALIDATION:")) {
        toast.error(message.replace("VALIDATION:", "").trim());
      } else {
        toast.error(message);
      }
      setLoading(false);
    }
  }

  const selectedIsCurrent = selectedId ? isRowCurrent(selectedId) : true;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change plan</DialogTitle>
          <DialogDescription>
            Upgrades apply immediately (Stripe prorates). Downgrades and Free are scheduled for the end of your current
            billing period. New paid signups open Checkout in a new tab. Payment methods: Manage in Stripe.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <PlanRowButton
            row={catalog.free}
            loading={loading}
            selectedId={selectedId}
            onSelectRow={setSelectedId}
            isRowCurrent={isRowCurrent}
          />
          <Tabs
            value={interval}
            onValueChange={(v) => onIntervalChange(v as "monthly" | "yearly")}
            className="gap-3"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
            <TabsContent value="monthly" className="mt-0 space-y-2">
              <PlanRowButton
                row={catalog.proMonthly}
                loading={loading}
                selectedId={selectedId}
                onSelectRow={setSelectedId}
                isRowCurrent={isRowCurrent}
              />
              <PlanRowButton
                row={catalog.enterpriseMonthly}
                loading={loading}
                selectedId={selectedId}
                onSelectRow={setSelectedId}
                isRowCurrent={isRowCurrent}
              />
            </TabsContent>
            <TabsContent value="yearly" className="mt-0 space-y-2">
              <PlanRowButton
                row={catalog.proYearly}
                loading={loading}
                selectedId={selectedId}
                onSelectRow={setSelectedId}
                isRowCurrent={isRowCurrent}
              />
              <div
                className={cn(
                  "w-full rounded-md border px-3 py-3 text-left opacity-70",
                  "border-muted bg-muted/30 cursor-not-allowed",
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p className="font-medium text-muted-foreground">Enterprise</p>
                      <Badge variant="secondary" className="shrink-0 font-normal">
                        Not available
                      </Badge>
                    </div>
                    <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                      Enterprise is offered on monthly billing only.
                    </p>
                  </div>
                  <p className="text-muted-foreground shrink-0 text-right text-sm font-medium tabular-nums">—</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
        <DialogFooter className="mt-2 gap-3 pt-2 sm:mt-0 sm:flex-row sm:justify-end sm:gap-3">
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Close
          </Button>
          <Button
            type="button"
            disabled={loading || !selectedId || selectedIsCurrent}
            onClick={() => void onContinue()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Working…
              </>
            ) : selectedIsCurrent ? (
              "Current selection"
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
