"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { queryKeys } from "@/lib/query/keys";
import { cn } from "@/lib/utils";

type UsagePayload = {
  plan: string;
  usage: Record<
    string,
    {
      used: number;
      limit: number;
      remaining: number;
    }
  >;
};

function pct(used: number, limit: number): number {
  if (!Number.isFinite(limit) || limit <= 0) return 0;
  return Math.min(100, (used / limit) * 100);
}

function barColor(p: number) {
  if (p < 60) return "bg-emerald-600";
  if (p < 80) return "bg-amber-500";
  return "bg-red-600";
}

const LABELS: Record<string, string> = {
  apiCallsPerMonth: "API calls (monthly)",
  membersPerOrg: "Members",
  storageGb: "Storage (GB)",
  webhookEndpoints: "Webhook endpoints",
};

export function OrgUsagePanel({ orgId }: { orgId: string }) {
  const { data, isLoading, isError, refetch, dataUpdatedAt } = useQuery({
    queryKey: queryKeys.usage.detail(orgId),
    queryFn: async () => {
      const res = await fetch(`/api/orgs/${orgId}/usage`);
      if (!res.ok) throw new Error("Failed to load usage");
      return res.json() as Promise<UsagePayload>;
    },
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return <p className="text-muted-foreground text-sm">Loading usage…</p>;
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-destructive text-sm">Could not load usage.</p>
        <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  const entries = Object.entries(data.usage) as [
    string,
    { used: number; limit: number; remaining: number },
  ][];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          Plan: <span className="text-foreground font-medium">{data.plan}</span>
          {dataUpdatedAt ? (
            <span className="ml-2">
              · Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
            </span>
          ) : null}
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>
            Refresh
          </Button>
          <Button type="button" size="sm" asChild>
            <Link href="/pricing">Upgrade plan</Link>
          </Button>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {entries.map(([key, u]) => {
          const finiteLimit = Number.isFinite(u.limit);
          const p = finiteLimit ? pct(u.used, u.limit) : 0;
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{LABELS[key] ?? key}</CardTitle>
                <CardDescription>
                  {finiteLimit ? (
                    <>
                      {u.used} / {u.limit} ({Math.round(p)}%)
                    </>
                  ) : (
                    <>Unlimited</>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {finiteLimit ? (
                  <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                    <div
                      className={cn("h-full rounded-full transition-all", barColor(p))}
                      style={{ width: `${p}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No quota on this plan.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
