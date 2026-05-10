import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { roleAtLeast } from "@/lib/auth/rbac";
import { getMemberRole } from "@/lib/auth/require-org";

export async function requireOrgMemberSession(organizationId: string) {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: headersToWebRequestHeaders(h),
  });
  if (!session?.user?.id) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = await getMemberRole(organizationId, session.user.id);
  if (!role) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, session, role };
}

export async function requireOrgAdminSession(organizationId: string) {
  const h = await headers();
  const session = await auth.api.getSession({
    headers: headersToWebRequestHeaders(h),
  });
  if (!session?.user?.id) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const role = await getMemberRole(organizationId, session.user.id);
  if (!role || !roleAtLeast(role, "admin")) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, session, role };
}
