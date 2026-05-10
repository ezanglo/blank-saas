"use server";

import { headers } from "next/headers";

import { auth } from "@/lib/auth";
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

  return auth.api.changePassword({
    body: {
      currentPassword: input.currentPassword,
      newPassword: input.newPassword,
    },
    headers: webHeaders,
  });
}
