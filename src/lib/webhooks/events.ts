import { z } from "zod";

export const WebhookEvents = {
  "org.created": z.object({ orgId: z.string(), name: z.string() }),
  "org.updated": z.object({
    orgId: z.string(),
    changes: z.record(z.string(), z.unknown()),
  }),
  "member.invited": z.object({
    orgId: z.string(),
    email: z.string(),
    role: z.string(),
  }),
  "member.removed": z.object({ orgId: z.string(), userId: z.string() }),
  "member.role_changed": z.object({
    orgId: z.string(),
    userId: z.string(),
    newRole: z.string(),
  }),
  "billing.subscription_activated": z.object({ orgId: z.string(), plan: z.string() }),
  "billing.subscription_cancelled": z.object({ orgId: z.string() }),
  "billing.plan_changed": z.object({
    orgId: z.string(),
    from: z.string(),
    to: z.string(),
  }),
} as const;

export type WebhookEventType = keyof typeof WebhookEvents;
