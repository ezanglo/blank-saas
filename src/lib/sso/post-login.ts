import { and, eq } from "@payloadcms/db-postgres/drizzle";

import { SSO_LOGIN } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

export function extractSamlProviderIdFromAuthPath(pathStr: string): string | null {
  const m = pathStr.match(/\/sso\/saml2\/(?:sp\/acs|callback)\/([^/?]+)/);
  return m?.[1]?.trim() || null;
}

export async function emitSsoLoginAuditAndAnalytics(params: {
  userId: string;
  userEmail: string | null | undefined;
  providerId: string;
}): Promise<void> {
  const [org] = await db
    .select({
      id: schema.organizations.id,
      name: schema.organizations.name,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.samlConnectionId, params.providerId))
    .limit(1);

  const [prov] = await db
    .select({
      issuer: schema.sso_providers.issuer,
      domain: schema.sso_providers.domain,
    })
    .from(schema.sso_providers)
    .where(eq(schema.sso_providers.providerId, params.providerId))
    .limit(1);

  const idpName =
    prov?.issuer?.startsWith("http")
      ? (() => {
          try {
            return new URL(prov.issuer).hostname;
          } catch {
            return prov.domain;
          }
        })()
      : (prov?.issuer ?? prov?.domain ?? params.providerId);

  if (org) {
    fireAndForgetAuditLog("auth.sso_login", {
      organizationId: org.id,
      actorId: params.userId,
      actorEmail: params.userEmail ?? undefined,
      metadata: { idpName },
    });
  }

  captureServerEvent({
    distinctId: params.userId,
    event: SSO_LOGIN,
    properties: {
      idpName,
      providerId: params.providerId,
      ...(org ? { orgId: org.id, orgName: org.name } : {}),
    },
    groups: org ? { company: org.id } : undefined,
  });
}

/** Ensure SSO users are linked to the org that owns the IdP connection. */
export async function ensureOrgMembershipForSsoProvider(params: {
  organizationId: string;
  userId: string;
}): Promise<void> {
  const existing = await db
    .select({ id: schema.members.id })
    .from(schema.members)
    .where(
      and(
        eq(schema.members.organization, params.organizationId),
        eq(schema.members.user, params.userId),
      ),
    )
    .limit(1);
  if (existing.length > 0) return;

  const now = new Date().toISOString();
  await db.insert(schema.members).values({
    organization: params.organizationId,
    user: params.userId,
    role: "member",
    updatedAt: now,
    createdAt: now,
  });
}
