import { PLANS, type PlanKey } from "@/lib/quota/plans";

function fmt(n: number): string {
  if (n === Number.POSITIVE_INFINITY) return "Unlimited";
  if (n >= 1_000_000) return "1M+";
  return n.toLocaleString();
}

export function normalizePlanKey(plan: string): PlanKey {
  if (plan === "pro" || plan === "enterprise") return plan;
  return "free";
}

export function planDisplayName(plan: string): string {
  const p = normalizePlanKey(plan);
  if (p === "pro") return "Pro";
  if (p === "enterprise") return "Enterprise";
  return "Free";
}

/** One-line limits summary for billing UI. */
export function planLimitsSummary(plan: string): string {
  const p = normalizePlanKey(plan);
  const L = PLANS[p];
  return `${fmt(L.apiCallsPerMonth)} API calls/mo · ${fmt(L.membersPerOrg)} members · ${fmt(L.webhookEndpoints)} webhook endpoints · ${fmt(L.storageGb)} GB storage`;
}

export function planBillingBlurb(plan: string): string {
  const p = normalizePlanKey(plan);
  if (p === "free") {
    return "Core features with starter limits. Upgrade when you need higher quotas and more webhook endpoints.";
  }
  if (p === "pro") {
    return "Built for growing teams: higher API volume, more seats, storage, and outbound webhooks.";
  }
  return "Maximum limits for large organizations and mission-critical workloads.";
}
