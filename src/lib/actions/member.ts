"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { memberContactForAudit, memberRoleSnapshot } from "@/lib/audit/member-lookup";
import { fireAndForgetAuditLog } from "@/lib/audit/log";
import { clientIpFromHeaders, userAgentFromHeaders } from "@/lib/audit/request-context";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError, getMemberRole } from "@/lib/auth/require-org";
import { canManageMembers } from "@/lib/auth/rbac";
import { getOrgPlan } from "@/lib/org/plan";
import { checkQuota } from "@/lib/quota/check";
import { sendWebhookFireAndForget } from "@/lib/webhooks/send";

export async function inviteMemberAction(input: {
  organizationId: string;
  email: string;
  role: "owner" | "admin" | "member";
}) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const memberRole = await getMemberRole(input.organizationId, session.user.id);
  if (!canManageMembers(memberRole)) throw new ForbiddenError();

  const email = input.email.trim().toLowerCase();
  if (!email) throw new Error("Email is required");

  const plan = await getOrgPlan(input.organizationId);
  const memberQuota = await checkQuota(input.organizationId, plan, "membersPerOrg");
  if (!memberQuota.allowed) {
    throw new Error("Member limit reached for this plan. Upgrade to add more people.");
  }

  const result = await auth.api.createInvitation({
    body: {
      email,
      role: input.role,
      organizationId: input.organizationId,
    },
    headers: webHeaders,
  });

  sendWebhookFireAndForget(input.organizationId, "member.invited", {
    orgId: input.organizationId,
    email,
    role: input.role,
  });

  fireAndForgetAuditLog("member.invited", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "member",
    resourceId: email,
    metadata: { email, role: input.role },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  return result;
}

export async function cancelInvitationAction(input: {
  organizationId: string;
  invitationId: string;
}) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const memberRole = await getMemberRole(input.organizationId, session.user.id);
  if (!canManageMembers(memberRole)) throw new ForbiddenError();

  const result = await auth.api.cancelInvitation({
    body: { invitationId: input.invitationId },
    headers: webHeaders,
  });

  fireAndForgetAuditLog("invitation.cancelled", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "invitation",
    resourceId: input.invitationId,
    metadata: { invitationId: input.invitationId },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  return result;
}

export async function removeMemberAction(input: {
  organizationId: string;
  memberIdOrEmail: string;
}) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const memberRole = await getMemberRole(input.organizationId, session.user.id);
  if (!canManageMembers(memberRole)) throw new ForbiddenError();

  const contact = await memberContactForAudit(
    input.organizationId,
    input.memberIdOrEmail,
  );

  const result = await auth.api.removeMember({
    body: {
      organizationId: input.organizationId,
      memberIdOrEmail: input.memberIdOrEmail,
    },
    headers: webHeaders,
  });

  if (contact?.userId) {
    sendWebhookFireAndForget(input.organizationId, "member.removed", {
      orgId: input.organizationId,
      userId: contact.userId,
    });
  }

  fireAndForgetAuditLog("member.removed", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "member",
    resourceId: contact?.userId ?? input.memberIdOrEmail,
    metadata: {
      userId: contact?.userId ?? input.memberIdOrEmail,
      email: contact?.email ?? input.memberIdOrEmail,
    },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  return result;
}

export async function updateMemberRoleAction(input: {
  organizationId: string;
  memberId: string;
  role: "owner" | "admin" | "member";
}) {
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const memberRole = await getMemberRole(input.organizationId, session.user.id);
  if (!canManageMembers(memberRole)) throw new ForbiddenError();

  const before = await memberRoleSnapshot(input.organizationId, input.memberId);

  const result = await auth.api.updateMemberRole({
    body: {
      organizationId: input.organizationId,
      memberId: input.memberId,
      role: input.role,
    },
    headers: webHeaders,
  });

  if (before?.userId) {
    sendWebhookFireAndForget(input.organizationId, "member.role_changed", {
      orgId: input.organizationId,
      userId: before.userId,
      newRole: input.role,
    });
  }

  fireAndForgetAuditLog("member.role_changed", {
    organizationId: input.organizationId,
    actorId: session.user.id,
    actorEmail: session.user.email,
    actorName: session.user.name,
    resourceType: "member",
    resourceId: before?.userId ?? input.memberId,
    metadata: {
      userId: before?.userId ?? input.memberId,
      from: before?.role ?? "unknown",
      to: input.role,
    },
    ipAddress: clientIpFromHeaders(h),
    userAgent: userAgentFromHeaders(h),
  });

  return result;
}
