import { createMonthlyQuotaLimiter, monthlyQuotaId } from "@/lib/quota/limiter";
import { countOrgMembers } from "@/lib/quota/member-count";
import type { PlanKey } from "@/lib/quota/plans";
import { PLANS } from "@/lib/quota/plans";
import { maybeSendQuotaWarningEmail } from "@/lib/quota/warn-email";
import { countWebhookEndpointsForOrg } from "@/lib/webhooks/endpoint-count";

export type QuotaResource = keyof (typeof PLANS)["free"];

export async function checkQuota(
  orgId: string,
  plan: PlanKey,
  resource: QuotaResource,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = PLANS[plan][resource];
  if (limit === Number.POSITIVE_INFINITY) {
    return {
      allowed: true,
      remaining: Number.POSITIVE_INFINITY,
      limit: Number.POSITIVE_INFINITY,
    };
  }

  const lim = limit as number;

  if (resource === "membersPerOrg") {
    const used = await countOrgMembers(orgId);
    const remaining = Math.max(0, lim - used);
    if (remaining / lim < 0.2) {
      void maybeSendQuotaWarningEmail(orgId, resource, remaining, lim);
    }
    return { allowed: used < lim, remaining, limit: lim };
  }

  if (resource === "webhookEndpoints") {
    const used = await countWebhookEndpointsForOrg(orgId);
    const remaining = Math.max(0, lim - used);
    if (remaining / lim < 0.2) {
      void maybeSendQuotaWarningEmail(orgId, resource, remaining, lim);
    }
    return { allowed: used < lim, remaining, limit: lim };
  }

  if (resource === "storageGb") {
    const used = 0;
    const remaining = Math.max(0, lim - used);
    if (remaining / lim < 0.2) {
      void maybeSendQuotaWarningEmail(orgId, resource, remaining, lim);
    }
    return { allowed: used < lim, remaining, limit: lim };
  }

  const limiter = createMonthlyQuotaLimiter(orgId, resource, lim);
  const result = await limiter.limit(monthlyQuotaId);
  if (result.pending) await result.pending;
  if (result.remaining / lim < 0.2) {
    void maybeSendQuotaWarningEmail(orgId, resource, result.remaining, lim);
  }
  return {
    allowed: result.success,
    remaining: result.remaining,
    limit: result.limit,
  };
}

/** Consume one unit of a Redis-backed monthly quota (e.g. API call). */
export async function consumeMonthlyQuota(
  orgId: string,
  plan: PlanKey,
  resource: QuotaResource,
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  return checkQuota(orgId, plan, resource);
}
