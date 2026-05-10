"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError, getMemberRole } from "@/lib/auth/require-org";
import { canManageMembers } from "@/lib/auth/rbac";

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

  return auth.api.createInvitation({
    body: {
      email,
      role: input.role,
      organizationId: input.organizationId,
    },
    headers: webHeaders,
  });
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

  return auth.api.cancelInvitation({
    body: { invitationId: input.invitationId },
    headers: webHeaders,
  });
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

  return auth.api.removeMember({
    body: {
      organizationId: input.organizationId,
      memberIdOrEmail: input.memberIdOrEmail,
    },
    headers: webHeaders,
  });
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

  return auth.api.updateMemberRole({
    body: {
      organizationId: input.organizationId,
      memberId: input.memberId,
      role: input.role,
    },
    headers: webHeaders,
  });
}
