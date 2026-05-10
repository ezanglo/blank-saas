"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { resolveAuditOrganizationIdForSession } from "@/lib/audit/resolve-org";
import {
  clientIpFromHeaders,
  userAgentFromHeaders,
} from "@/lib/audit/request-context";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError } from "@/lib/auth/require-org";

export async function updateProfileAction(input: { name: string }) {
  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  return auth.api.updateUser({
    body: { name },
    headers: webHeaders,
  });
}

export async function changePasswordAction(input: {
  currentPassword: string;
  newPassword: string;
}) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const result = await auth.api.changePassword({
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
    headers: webHeaders,
  });

  const orgId = await resolveAuditOrganizationIdForSession(session);
  if (orgId) {
    fireAndForgetAuditLog("auth.password_changed", {
      organizationId: orgId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      resourceType: "user",
      resourceId: session.user.id,
      metadata: {},
      ipAddress: clientIpFromHeaders(h),
      userAgent: userAgentFromHeaders(h),
    });
  }

  return result;
}
