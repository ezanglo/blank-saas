"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { ForbiddenError } from "@/lib/auth/require-org";

export async function acceptInvitationAction(invitationId: string) {
  if (!invitationId) throw new Error("invitationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  const res = await auth.api.acceptInvitation({
    body: { invitationId },
    headers: webHeaders,
  });
  return res;
}

export async function rejectInvitationAction(invitationId: string) {
  if (!invitationId) throw new Error("invitationId required");
  const h = await headers();
  const webHeaders = headersToWebRequestHeaders(h);
  const session = await auth.api.getSession({ headers: webHeaders });
  if (!session) throw new ForbiddenError("Not signed in");

  return auth.api.rejectInvitation({
    body: { invitationId },
    headers: webHeaders,
  });
}
