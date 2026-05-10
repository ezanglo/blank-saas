"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { clientIpFromHeaders, userAgentFromHeaders } from "@/lib/audit/request-context";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError, getMemberRole, requireOrgRole } from "@/lib/auth/require-org";
import { roleAtLeast } from "@/lib/auth/rbac";
import { isGranularPermissionsEnabled } from "@/lib/permissions/feature";
import { listOrgPermissions, type OrgPermissionRow } from "@/lib/permissions/list";
import { validateGrantActions } from "@/lib/permissions/validate-actions";
import type { Permission } from "@/payload-types";
import config from "@payload-config";
import { getPayload } from "payload";

function orgIdFromPermissionDoc(organization: Permission["organization"]): string {
  if (typeof organization === "string") return organization;
  return organization.id;
}

function requireFeature(): void {
  if (!isGranularPermissionsEnabled()) {
    throw new ForbiddenError("Granular permissions are not enabled.");
  }
}

export async function grantPermissionAction(input: {
  organizationId: string;
  orgSlug: string;
  subjectId: string;
  subjectType: "user" | "org_role";
  resourceType: string;
  resourceId: string;
  actions: string[];
  expiresAt?: string | null;
}) {
  requireFeature();
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  await requireOrgRole({
    organizationId: input.organizationId,
    userId: session.user.id,
    min: "owner",
  });

  const resourceType = input.resourceType.trim();
  const resourceId = input.resourceId.trim();
  if (!resourceType || !resourceId) {
    throw new Error("Resource type and resource id are required.");
  }

  validateGrantActions(resourceType, input.actions);

  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "permissions",
    where: {
      and: [
        { organization: { equals: input.organizationId } },
        { subjectId: { equals: input.subjectId } },
        { subjectType: { equals: input.subjectType } },
        { resourceType: { equals: resourceType } },
        { resourceId: { equals: resourceId } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  });

  const expiresAt = input.expiresAt?.trim() ? input.expiresAt.trim() : undefined;

  if (existing.docs[0]) {
    await payload.update({
      collection: "permissions",
      id: existing.docs[0].id,
      data: {
        actions: input.actions,
        grantedBy: session.user.id,
        expiresAt: expiresAt ?? null,
      },
      overrideAccess: true,
    });
  } else {
    await payload.create({
      collection: "permissions",
      data: {
        organization: input.organizationId,
        subjectId: input.subjectId,
        subjectType: input.subjectType,
        resourceType,
        resourceId,
        actions: input.actions,
        grantedBy: session.user.id,
        expiresAt: expiresAt ?? undefined,
      },
      overrideAccess: true,
    });
  }

  fireAndForgetAuditLog("permission.granted", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "permission",
    resourceId: `${resourceType}:${resourceId}:${input.subjectId}`,
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
    metadata: {
      subjectId: input.subjectId,
      subjectType: input.subjectType,
      resourceType,
      resourceId,
      actions: input.actions,
    },
  });

  revalidatePath(`/organizations/${input.orgSlug}/settings/permissions`);
}

export async function revokePermissionAction(input: {
  organizationId: string;
  orgSlug: string;
  permissionId: string;
}) {
  requireFeature();
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  await requireOrgRole({
    organizationId: input.organizationId,
    userId: session.user.id,
    min: "owner",
  });

  const payload = await getPayload({ config });
  const doc = await payload.findByID({
    collection: "permissions",
    id: input.permissionId,
    overrideAccess: true,
  });

  if (!doc) {
    throw new Error("Permission not found.");
  }

  const rowOrg = orgIdFromPermissionDoc(doc.organization);
  if (rowOrg !== input.organizationId) {
    throw new ForbiddenError();
  }

  await payload.delete({
    collection: "permissions",
    id: input.permissionId,
    overrideAccess: true,
  });

  fireAndForgetAuditLog("permission.revoked", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "permission",
    resourceId: input.permissionId,
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
    metadata: { permissionId: input.permissionId },
  });

  revalidatePath(`/organizations/${input.orgSlug}/settings/permissions`);
}

export async function listPermissionsAction(input: {
  organizationId: string;
  resourceType?: string;
  resourceId?: string;
  subjectId?: string;
  page?: number;
}): Promise<{ docs: OrgPermissionRow[]; totalDocs: number; totalPages: number; page: number }> {
  requireFeature();
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const role = await getMemberRole(input.organizationId, session.user.id);
  if (!role || !roleAtLeast(role, "admin")) {
    throw new ForbiddenError();
  }

  return listOrgPermissions({
    organizationId: input.organizationId,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    subjectId: input.subjectId,
    page: input.page,
  });
}
