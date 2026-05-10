"use server";

import { eq } from "@payloadcms/db-postgres/drizzle";
import { headers } from "next/headers";
import slugify from "slugify";

import { auth } from "@/lib/auth";
import { clientIpFromHeaders, userAgentFromHeaders } from "@/lib/audit/request-context";
import { createAuditLog, fireAndForgetAuditLog } from "@/lib/audit/log";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import {
  ForbiddenError,
  getMemberRole,
  requireOrgRole,
} from "@/lib/auth/require-org";
import { canDeleteOrganization, canUpdateOrganization } from "@/lib/auth/rbac";
import { assertOrgScopedAccess } from "@/lib/permissions/org-access";
import { ORG_CREATED, ORG_DELETED } from "@/lib/analytics/events";
import { captureServerEvent } from "@/lib/analytics/server";
import { db } from "@/lib/db";
import { deleteSvixApplication, provisionSvixApplication } from "@/lib/webhooks/provision";
import { sendWebhookFireAndForget } from "@/lib/webhooks/send";
import * as schema from "@/payload-generated-schema";

type CreatedOrg = { id: string; name: string; slug: string };

/** Create org via Better Auth (same row as Payload `organizations`). */
export async function createOrganizationAction(input: {
  name: string;
  slug?: string;
}) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");
  const slug =
    (input.slug ?? slugify(name, { lower: true, strict: true })).trim() || "org";

  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const result = await auth.api.createOrganization({
    body: { name, slug },
    headers: webHeaders,
  });

  const org = result as CreatedOrg;
  let orgId = org.id;
  if (!orgId) {
    const [row] = await db
      .select({ id: schema.organizations.id })
      .from(schema.organizations)
      .where(eq(schema.organizations.slug, org.slug ?? slug))
      .limit(1);
    orgId = row?.id ?? "";
  }
  if (orgId) {
    fireAndForgetAuditLog("org.created", {
      organizationId: orgId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      resourceType: "organization",
      resourceId: orgId,
      metadata: { name: org.name ?? name },
      ipAddress: clientIpFromHeaders(h),
      userAgent: userAgentFromHeaders(h),
    });
    await provisionSvixApplication({
      organizationId: orgId,
      name: org.name ?? name,
    });
    sendWebhookFireAndForget(orgId, "org.created", {
      orgId,
      name: org.name ?? name,
    });
    captureServerEvent({
      distinctId: session.user.id,
      event: ORG_CREATED,
      properties: {
        orgId,
        orgName: org.name ?? name,
        plan: "free",
      },
      groups: { company: orgId },
    });
  }

  return result;
}

/** Update org name/slug (admin+). */
export async function updateOrganizationAction(input: {
  organizationId: string;
  name?: string;
  slug?: string;
}) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const role = await getMemberRole(input.organizationId, session.user.id);
  await assertOrgScopedAccess({
    organizationId: input.organizationId,
    userId: session.user.id,
    userRole: role,
    rbacAllows: canUpdateOrganization(role),
    resourceType: "org_settings",
    action: "write",
  });

  const data: { name?: string; slug?: string } = {};
  if (input.name !== undefined) data.name = input.name.trim();
  if (input.slug !== undefined) data.slug = input.slug.trim();

  if (Object.keys(data).length === 0) {
    throw new Error("No fields to update");
  }

  const result = await auth.api.updateOrganization({
    body: {
      organizationId: input.organizationId,
      data,
    },
    headers: webHeaders,
  });

  fireAndForgetAuditLog("org.updated", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "organization",
    resourceId: input.organizationId,
    metadata: { changes: data as Record<string, unknown> },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  sendWebhookFireAndForget(input.organizationId, "org.updated", {
    orgId: input.organizationId,
    changes: data as Record<string, unknown>,
  });

  return result;
}

/** Delete org via Better Auth (owner only with default AC). */
export async function deleteOrganizationAction(organizationId: string) {
  if (!organizationId) throw new Error("organizationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const role = await getMemberRole(organizationId, session.user.id);
  if (!canDeleteOrganization(role)) throw new ForbiddenError();

  const [row] = await db
    .select({
      name: schema.organizations.name,
      svixAppId: schema.organizations.svixAppId,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);

  await createAuditLog("org.deleted", {
    organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "organization",
    resourceId: organizationId,
    metadata: { name: row?.name ?? "" },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  void deleteSvixApplication(row?.svixAppId ?? null);

  captureServerEvent({
    distinctId: session.user.id,
    event: ORG_DELETED,
    properties: { orgId: organizationId },
    groups: { company: organizationId },
  });

  return auth.api.deleteOrganization({
    body: { organizationId },
    headers: webHeaders,
  });
}

export async function setActiveOrganizationAction(input: {
  organizationId: string;
}) {
  if (!input.organizationId) throw new Error("organizationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");
  await requireOrgRole({
    organizationId: input.organizationId,
    userId: session.user.id,
    min: "member",
  });
  return auth.api.setActiveOrganization({
    body: { organizationId: input.organizationId },
    headers: webHeaders,
  });
}
