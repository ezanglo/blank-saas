import config from "@payload-config";
import type { Where } from "payload";
import { getPayload } from "payload";

import { normalizePermissionActions } from "@/lib/permissions/normalize-actions";

export type OrgPermissionRow = {
  id: string;
  subjectId: string;
  subjectType: "user" | "org_role";
  resourceType: string;
  resourceId: string;
  actions: string[];
  grantedBy: string | null | undefined;
  expiresAt: string | null | undefined;
  updatedAt: string;
  createdAt: string;
};

export async function listOrgPermissions(params: {
  organizationId: string;
  resourceType?: string;
  resourceId?: string;
  subjectId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ docs: OrgPermissionRow[]; totalDocs: number; totalPages: number; page: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));

  const and: Where[] = [{ organization: { equals: params.organizationId } }];

  if (params.resourceType?.trim()) {
    and.push({ resourceType: { equals: params.resourceType.trim() } });
  }
  if (params.resourceId?.trim()) {
    and.push({ resourceId: { equals: params.resourceId.trim() } });
  }
  if (params.subjectId?.trim()) {
    and.push({ subjectId: { contains: params.subjectId.trim() } });
  }

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "permissions",
    where: { and },
    sort: "-updatedAt",
    limit: pageSize,
    page,
    overrideAccess: true,
  });

  const docs: OrgPermissionRow[] = result.docs.map((d) => ({
    id: d.id,
    subjectId: d.subjectId,
    subjectType: d.subjectType,
    resourceType: d.resourceType,
    resourceId: d.resourceId,
    actions: normalizePermissionActions(d.actions),
    grantedBy: d.grantedBy,
    expiresAt: d.expiresAt ?? null,
    updatedAt: typeof d.updatedAt === "string" ? d.updatedAt : String(d.updatedAt),
    createdAt: typeof d.createdAt === "string" ? d.createdAt : String(d.createdAt),
  }));

  return {
    docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page ?? page,
  };
}
