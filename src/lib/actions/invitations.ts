"use server";

import { eq } from "@payloadcms/db-postgres/drizzle";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { clientIpFromHeaders, userAgentFromHeaders } from "@/lib/audit/request-context";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError } from "@/lib/auth/require-org";
import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

export async function acceptInvitationAction(invitationId: string) {
  if (!invitationId) throw new Error("invitationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const [inv] = await db
    .select({
      organizationId: schema.invitations.organization,
      email: schema.invitations.email,
    })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, invitationId))
    .limit(1);

  const res = await auth.api.acceptInvitation({
    body: { invitationId },
    headers: webHeaders,
  });

  if (inv?.organizationId) {
    fireAndForgetAuditLog("invitation.accepted", {
      organizationId: inv.organizationId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      resourceType: "invitation",
      resourceId: invitationId,
      metadata: { invitationId, email: inv.email },
      ipAddress: clientIpFromHeaders(h),
      userAgent: userAgentFromHeaders(h),
    });
  }

  return res;
}

export async function rejectInvitationAction(invitationId: string) {
  if (!invitationId) throw new Error("invitationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const [inv] = await db
    .select({
      organizationId: schema.invitations.organization,
      email: schema.invitations.email,
    })
    .from(schema.invitations)
    .where(eq(schema.invitations.id, invitationId))
    .limit(1);

  const result = await auth.api.rejectInvitation({
    body: { invitationId },
    headers: webHeaders,
  });

  if (inv?.organizationId) {
    fireAndForgetAuditLog("invitation.rejected", {
      organizationId: inv.organizationId,
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorName: session.user.name,
      resourceType: "invitation",
      resourceId: invitationId,
      metadata: { invitationId, email: inv.email },
      ipAddress: clientIpFromHeaders(h),
      userAgent: userAgentFromHeaders(h),
    });
  }

  return result;
}
