"use server";

import { eq, sql } from "@payloadcms/db-postgres/drizzle";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError, getMemberRole } from "@/lib/auth/require-org";
import { canConfigureSso } from "@/lib/auth/rbac";
import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { clientIpFromHeaders, userAgentFromHeaders } from "@/lib/audit/request-context";
import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";
import { orgSsoProviderId } from "@/lib/sso/org-sso-provider-id";
import {
  fetchIdpMetadataXml,
  guessIdpDisplayName,
  normalizeEmailDomain,
  resolveSamlIssuer,
} from "@/lib/sso/saml-metadata";

function appOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.BETTER_AUTH_URL ??
    "http://localhost:3000"
  )
    .split("#")[0]
    .trim();
}

async function requireSsoOwner(organizationId: string) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session?.user?.id) throw new ForbiddenError("Not signed in");
  const role = await getMemberRole(organizationId, session.user.id);
  if (!canConfigureSso(role)) throw new ForbiddenError();
  return { session, h, webHeaders };
}

export async function createOrgSamlConnectionAction(input: {
  organizationId: string;
  orgSlug: string;
  /** Lowercase email domain (e.g. acme.com). */
  domain: string;
  metadataXml?: string;
  metadataUrl?: string;
}) {
  const { session, h, webHeaders } = await requireSsoOwner(input.organizationId);

  const normalizedDomain = normalizeEmailDomain(input.domain);
  if (!normalizedDomain) {
    throw new Error("A valid email domain is required.");
  }

  const [orgRow] = await db
    .select({
      id: schema.organizations.id,
      samlConnectionId: schema.organizations.samlConnectionId,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, input.organizationId))
    .limit(1);

  if (!orgRow) throw new Error("Organization not found.");
  if (orgRow.samlConnectionId) {
    throw new Error("This organization already has a SAML connection.");
  }

  const [domainTaken] = await db
    .select({ id: schema.sso_providers.id })
    .from(schema.sso_providers)
    .where(sql`lower(${schema.sso_providers.domain}) = ${normalizedDomain}`)
    .limit(1);
  if (domainTaken) {
    throw new Error("Another organization already uses this SSO domain.");
  }

  let xml = input.metadataXml?.trim() ?? "";
  if (input.metadataUrl?.trim()) {
    xml = await fetchIdpMetadataXml(input.metadataUrl.trim());
  }
  if (!xml) {
    throw new Error("Provide IdP metadata XML or a metadata URL.");
  }

  const issuer = resolveSamlIssuer(xml, normalizedDomain);
  const idpName = guessIdpDisplayName(xml, issuer);
  const pid = orgSsoProviderId(input.organizationId);
  const origin = appOrigin();
  const dashboardUrl = `${origin}/dashboard`;

  const register = auth.api.registerSSOProvider as (opts: {
    body: Record<string, unknown>;
    headers: Headers;
  }) => Promise<unknown>;

  await register({
    headers: webHeaders,
    body: {
      providerId: pid,
      issuer,
      domain: normalizedDomain,
      organizationId: input.organizationId,
      samlConfig: {
        callbackUrl: dashboardUrl,
        idpMetadata: { metadata: xml },
        spMetadata: {},
        identifierFormat: "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
        mapping: {
          id: "nameID",
          email: "email",
          name: "displayName",
          emailVerified: "emailVerified",
        },
      },
    },
  });

  const now = new Date().toISOString();
  await db
    .update(schema.organizations)
    .set({ samlConnectionId: pid, updatedAt: now })
    .where(eq(schema.organizations.id, input.organizationId));

  fireAndForgetAuditLog("sso.connection_created", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    metadata: { idpName },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  revalidatePath(`/organizations/${input.orgSlug}/settings/sso`);
}

export async function deleteOrgSamlConnectionAction(input: {
  organizationId: string;
  orgSlug: string;
}) {
  const { session, h, webHeaders } = await requireSsoOwner(input.organizationId);

  const [orgRow] = await db
    .select({
      id: schema.organizations.id,
      samlConnectionId: schema.organizations.samlConnectionId,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, input.organizationId))
    .limit(1);

  if (!orgRow?.samlConnectionId) return;

  const del = auth.api.deleteSSOProvider as (opts: {
    body: { providerId: string };
    headers: Headers;
  }) => Promise<unknown>;

  await del({
    headers: webHeaders,
    body: { providerId: orgRow.samlConnectionId },
  });

  const now = new Date().toISOString();
  await db
    .update(schema.organizations)
    .set({ samlConnectionId: null, updatedAt: now })
    .where(eq(schema.organizations.id, input.organizationId));

  fireAndForgetAuditLog("sso.connection_deleted", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    metadata: { connectionId: orgRow.samlConnectionId },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  revalidatePath(`/organizations/${input.orgSlug}/settings/sso`);
}

export async function loadOrgSamlSummaryForSettings(organizationId: string) {
  await requireSsoOwner(organizationId);

  const [orgRow] = await db
    .select({
      samlConnectionId: schema.organizations.samlConnectionId,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);

  const pid = orgRow?.samlConnectionId;
  if (!pid) {
    return { connected: false as const };
  }

  const [prov] = await db
    .select({
      issuer: schema.sso_providers.issuer,
      domain: schema.sso_providers.domain,
    })
    .from(schema.sso_providers)
    .where(eq(schema.sso_providers.providerId, pid))
    .limit(1);

  const origin = appOrigin();
  const apiBase = `${origin}/api/auth`;

  return {
    connected: true as const,
    providerId: pid,
    issuer: prov?.issuer ?? null,
    domain: prov?.domain ?? null,
    spMetadataUrl: `${apiBase}/sso/saml2/sp/metadata?providerId=${encodeURIComponent(pid)}`,
    acsUrl: `${apiBase}/sso/saml2/sp/acs/${encodeURIComponent(pid)}`,
    callbackUrl: `${apiBase}/sso/saml2/callback/${encodeURIComponent(pid)}`,
  };
}
