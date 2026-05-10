import { describe, expect, it } from "vitest";

import { AuditEvents, type AuditAction } from "./events";

/** Minimal valid payloads per action — keeps the catalog honest as keys evolve. */
const samples: Partial<Record<AuditAction, unknown>> = {
  "auth.login": { method: "password" },
  "auth.logout": {},
  "auth.password_changed": {},
  "auth.2fa_enabled": {},
  "org.created": { name: "Acme" },
  "org.updated": { changes: { name: "Beta" } },
  "org.deleted": { name: "Acme" },
  "member.invited": { email: "a@b.co", role: "member" },
  "member.removed": { userId: "u1", email: "a@b.co" },
  "member.role_changed": { userId: "u1", from: "member", to: "admin" },
  "invitation.accepted": { invitationId: "inv1", email: "a@b.co" },
  "invitation.rejected": { invitationId: "inv1", email: "a@b.co" },
  "invitation.cancelled": { invitationId: "inv1" },
  "webhook.endpoint_created": { url: "https://example.com/hook" },
  "webhook.endpoint_deleted": { endpointId: "ep_1" },
  "flag.toggled": { flag: "x", enabled: true },
  "billing.checkout_started": { priceId: "price_1" },
  "billing.subscription_activated": { plan: "pro", stripeSubscriptionId: "sub_1" },
  "billing.subscription_cancelled": { stripeSubscriptionId: "sub_1" },
  "billing.subscription_resumed": { stripeSubscriptionId: "sub_1" },
  "billing.plan_changed": { from: "free", to: "pro" },
  "permission.granted": {
    subjectId: "s1",
    subjectType: "user",
    resourceType: "org",
    resourceId: "o1",
    actions: ["read"],
  },
  "permission.revoked": { permissionId: "p1" },
  "sso.connection_created": { idpName: "Okta" },
  "sso.connection_deleted": { connectionId: "c1" },
  "auth.sso_login": { idpName: "Okta" },
};

describe("AuditEvents", () => {
  it("has a sample payload for every catalog key", () => {
    const keys = Object.keys(AuditEvents) as AuditAction[];
    for (const key of keys) {
      const sample = samples[key];
      expect(sample, `add a sample for "${key}"`).toBeDefined();
      const parsed = AuditEvents[key].safeParse(sample);
      expect(parsed.success, JSON.stringify(parsed.error?.format())).toBe(true);
    }
  });

  it("keeps a stable, sorted action list (update intentionally when adding events)", () => {
    expect((Object.keys(AuditEvents) as AuditAction[]).sort()).toMatchInlineSnapshot(`
      [
        "auth.2fa_enabled",
        "auth.login",
        "auth.logout",
        "auth.password_changed",
        "auth.sso_login",
        "billing.checkout_started",
        "billing.plan_changed",
        "billing.subscription_activated",
        "billing.subscription_cancelled",
        "billing.subscription_resumed",
        "flag.toggled",
        "invitation.accepted",
        "invitation.cancelled",
        "invitation.rejected",
        "member.invited",
        "member.removed",
        "member.role_changed",
        "org.created",
        "org.deleted",
        "org.updated",
        "permission.granted",
        "permission.revoked",
        "sso.connection_created",
        "sso.connection_deleted",
        "webhook.endpoint_created",
        "webhook.endpoint_deleted",
      ]
    `);
  });
});
