import { z } from "zod";

/** Typed audit event payloads (PRD §13.3). */
export const AuditEvents = {
  "auth.login": z.object({
    method: z.enum(["password", "magic_link", "oauth"]),
  }),
  "auth.logout": z.object({}),
  "auth.password_changed": z.object({}),
  "auth.2fa_enabled": z.object({}),
  "org.created": z.object({ name: z.string() }),
  "org.updated": z.object({ changes: z.record(z.string(), z.unknown()) }),
  "org.deleted": z.object({ name: z.string() }),
  "member.invited": z.object({ email: z.string(), role: z.string() }),
  "member.removed": z.object({ userId: z.string(), email: z.string() }),
  "member.role_changed": z.object({
    userId: z.string(),
    from: z.string(),
    to: z.string(),
  }),
  "invitation.accepted": z.object({ invitationId: z.string(), email: z.string() }),
  "invitation.rejected": z.object({ invitationId: z.string(), email: z.string() }),
  "invitation.cancelled": z.object({ invitationId: z.string() }),
  "webhook.endpoint_created": z.object({ url: z.string() }),
  "webhook.endpoint_deleted": z.object({ endpointId: z.string() }),
  "flag.toggled": z.object({ flag: z.string(), enabled: z.boolean() }),
  "billing.checkout_started": z.object({ priceId: z.string() }),
  "billing.subscription_activated": z.object({
    plan: z.string(),
    stripeSubscriptionId: z.string(),
  }),
  "billing.subscription_cancelled": z.object({ stripeSubscriptionId: z.string() }),
  "billing.plan_changed": z.object({ from: z.string(), to: z.string() }),
  "permission.granted": z.object({
    subjectId: z.string(),
    subjectType: z.string(),
    resourceType: z.string(),
    resourceId: z.string(),
    actions: z.array(z.string()),
  }),
  "permission.revoked": z.object({ permissionId: z.string() }),
  "sso.connection_created": z.object({ idpName: z.string() }),
  "sso.connection_deleted": z.object({ connectionId: z.string() }),
  "auth.sso_login": z.object({ idpName: z.string() }),
} as const;

export type AuditAction = keyof typeof AuditEvents;
