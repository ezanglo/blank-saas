import { createPayloadBackedFlag } from "@/lib/flags/adapter";

export const newBillingUiFlag = createPayloadBackedFlag("new-billing-ui");
export const advancedAnalyticsFlag = createPayloadBackedFlag("advanced-analytics");
export const webhooksEnabledFlag = createPayloadBackedFlag("webhooks");

/** All product flags for optional `precompute()` / tooling. */
export const productFlags = [
  newBillingUiFlag,
  advancedAnalyticsFlag,
  webhooksEnabledFlag,
] as const;
