import { getMonthlyQuotaSnapshot } from "@/lib/quota/limiter";
import { countOrgMembers } from "@/lib/quota/member-count";
import type { PlanKey } from "@/lib/quota/plans";
import { PLANS } from "@/lib/quota/plans";
import { countWebhookEndpointsForOrg } from "@/lib/webhooks/endpoint-count";

export type UsageResourceKey = keyof (typeof PLANS)["free"];

export type UsageResourceSummary = {
  used: number;
  limit: number;
  remaining: number;
};

export async function getOrgUsageSummary(
  orgId: string,
  plan: PlanKey,
): Promise<Record<UsageResourceKey, UsageResourceSummary>> {
  const limits = PLANS[plan];

  const apiLimit = limits.apiCallsPerMonth;
  const apiSnap = await getMonthlyQuotaSnapshot(orgId, "apiCallsPerMonth", apiLimit);

  const memberUsed = await countOrgMembers(orgId);
  const memberLimit = limits.membersPerOrg;
  const memberLim =
    memberLimit === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : memberLimit;
  const memberRemaining =
    memberLimit === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : Math.max(0, memberLimit - memberUsed);

  const webhookUsed = await countWebhookEndpointsForOrg(orgId);
  const whLimit = limits.webhookEndpoints;
  const whRem =
    whLimit === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : Math.max(0, whLimit - webhookUsed);

  const storageLimit = limits.storageGb;
  const storageUsed = 0;
  const storageRem =
    storageLimit === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : Math.max(0, storageLimit - storageUsed);

  return {
    apiCallsPerMonth: {
      used: apiSnap.used,
      limit: apiSnap.limit,
      remaining: apiSnap.remaining,
    },
    membersPerOrg: {
      used: memberUsed,
      limit: memberLim,
      remaining: memberRemaining,
    },
    storageGb: {
      used: storageUsed,
      limit: storageLimit === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : storageLimit,
      remaining: storageRem,
    },
    webhookEndpoints: {
      used: webhookUsed,
      limit: whLimit === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : whLimit,
      remaining: whRem,
    },
  };
}
