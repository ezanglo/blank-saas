import { NextResponse } from "next/server";

import { requireOrgAdminSession } from "@/lib/auth/require-org-api";
import { isGranularPermissionsEnabled } from "@/lib/permissions/feature";
import { listOrgPermissions } from "@/lib/permissions/list";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await ctx.params;
  if (!isGranularPermissionsEnabled()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = await requireOrgAdminSession(orgId);
  if (!gate.ok) return gate.response;

  const url = new URL(request.url);
  const resourceType = url.searchParams.get("resourceType") ?? undefined;
  const resourceId = url.searchParams.get("resourceId") ?? undefined;
  const subjectId = url.searchParams.get("subjectId") ?? undefined;
  const pageRaw = url.searchParams.get("page");
  const page = pageRaw ? Number.parseInt(pageRaw, 10) : 1;

  const result = await listOrgPermissions({
    organizationId: orgId,
    resourceType,
    resourceId,
    subjectId,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  });

  return NextResponse.json(result);
}
