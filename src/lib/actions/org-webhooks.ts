"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { clientIpFromHeaders, userAgentFromHeaders } from "@/lib/audit/request-context";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError, getMemberRole } from "@/lib/auth/require-org";
import { roleAtLeast } from "@/lib/auth/rbac";
import { assertOrgScopedAccess } from "@/lib/permissions/org-access";
import { db } from "@/lib/db";
import { getOrgPlan } from "@/lib/org/plan";
import { checkQuota } from "@/lib/quota/check";
import {
  getSvixAppIdForOrg,
  provisionSvixApplication,
} from "@/lib/webhooks/provision";
import { getSvixClient } from "@/lib/webhooks/svix";
import * as schema from "@/payload-generated-schema";
import { eq } from "@payloadcms/db-postgres/drizzle";

async function requireOrgWebhookActor(
  organizationId: string,
  webhookAction: "write" | "delete",
) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");
  const role = await getMemberRole(organizationId, session.user.id);
  await assertOrgScopedAccess({
    organizationId,
    userId: session.user.id,
    userRole: role,
    rbacAllows: Boolean(role && roleAtLeast(role, "admin")),
    resourceType: "org_webhooks",
    action: webhookAction,
  });
  return { session, h, webHeaders };
}

async function ensureSvixApp(organizationId: string): Promise<string> {
  let appId = await getSvixAppIdForOrg(organizationId);
  if (appId) return appId;
  const [row] = await db
    .select({ name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);
  await provisionSvixApplication({
    organizationId,
    name: row?.name ?? "Organization",
  });
  appId = await getSvixAppIdForOrg(organizationId);
  if (!appId) throw new Error("Could not provision webhooks for this organization.");
  return appId;
}

export async function createOrgWebhookEndpointAction(input: {
  organizationId: string;
  orgSlug: string;
  url: string;
  filterTypes: string[];
}) {
  const { session, h } = await requireOrgWebhookActor(input.organizationId, "write");
  const url = input.url.trim();
  if (!url) throw new Error("URL is required");

  const plan = await getOrgPlan(input.organizationId);
  const q = await checkQuota(input.organizationId, plan, "webhookEndpoints", {
    distinctId: session.user.id,
  });
  if (!q.allowed) {
    throw new Error("Webhook endpoint limit reached for this plan.");
  }

  const appId = await ensureSvixApp(input.organizationId);
  const svix = getSvixClient();
  if (!svix) throw new Error("Svix is not configured (set SVIX_SERVER_URL and SVIX_AUTH_TOKEN).");

  await svix.endpoint.create(appId, {
    url,
    eventTypes: input.filterTypes.length ? input.filterTypes : null,
  });

  fireAndForgetAuditLog("webhook.endpoint_created", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "webhook",
    resourceId: url,
    metadata: { url },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  revalidatePath(`/organizations/${input.orgSlug}/settings/webhooks`);
}

export async function deleteOrgWebhookEndpointAction(input: {
  organizationId: string;
  orgSlug: string;
  endpointId: string;
}) {
  const { session, h } = await requireOrgWebhookActor(input.organizationId, "delete");
  const appId = await getSvixAppIdForOrg(input.organizationId);
  if (!appId) throw new Error("No webhook app for this organization.");

  const svix = getSvixClient();
  if (!svix) throw new Error("Svix is not configured.");

  await svix.endpoint.delete(appId, input.endpointId);

  fireAndForgetAuditLog("webhook.endpoint_deleted", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "webhook",
    resourceId: input.endpointId,
    metadata: { endpointId: input.endpointId },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  revalidatePath(`/organizations/${input.orgSlug}/settings/webhooks`);
}
