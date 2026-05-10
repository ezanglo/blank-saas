export const PLANS = {
  free: {
    apiCallsPerMonth: 1_000,
    membersPerOrg: 5,
    storageGb: 1,
    webhookEndpoints: 2,
  },
  pro: {
    apiCallsPerMonth: 50_000,
    membersPerOrg: 25,
    storageGb: 20,
    webhookEndpoints: 10,
  },
  enterprise: {
    apiCallsPerMonth: Number.POSITIVE_INFINITY,
    membersPerOrg: Number.POSITIVE_INFINITY,
    storageGb: Number.POSITIVE_INFINITY,
    webhookEndpoints: Number.POSITIVE_INFINITY,
  },
} as const;

export type PlanKey = keyof typeof PLANS;
