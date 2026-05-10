import config from "@payload-config";
import type { Where } from "payload";
import { getPayload } from "payload";

export type AuditLogRow = {
  id: string;
  action: string;
  actorEmail: string | null | undefined;
  actorName: string | null | undefined;
  resourceType: string | null | undefined;
  resourceId: string | null | undefined;
  ipAddress: string | null | undefined;
  metadata: unknown;
  createdAt: string;
};

export async function listAuditLogs(params: {
  organizationId: string;
  page?: number;
  pageSize?: number;
  action?: string;
  actorSearch?: string;
  from?: string;
  to?: string;
}): Promise<{ docs: AuditLogRow[]; totalDocs: number; totalPages: number; page: number }> {
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize ?? 25));

  const and: Where[] = [{ organization: { equals: params.organizationId } }];

  if (params.action?.trim()) {
    and.push({ action: { equals: params.action.trim() } });
  }

  if (params.actorSearch?.trim()) {
    const q = params.actorSearch.trim();
    and.push({
      or: [
        { actorEmail: { contains: q } },
        { actorName: { contains: q } },
      ],
    });
  }

  if (params.from?.trim()) {
    and.push({ createdAt: { greater_than_equal: `${params.from.trim()}T00:00:00.000Z` } });
  }

  if (params.to?.trim()) {
    and.push({ createdAt: { less_than_equal: `${params.to.trim()}T23:59:59.999Z` } });
  }

  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "audit-logs",
    where: { and },
    sort: "-createdAt",
    limit: pageSize,
    page,
    overrideAccess: true,
  });

  const docs: AuditLogRow[] = result.docs.map((d) => ({
    id: d.id,
    action: d.action,
    actorEmail: d.actorEmail,
    actorName: d.actorName,
    resourceType: d.resourceType,
    resourceId: d.resourceId,
    ipAddress: d.ipAddress,
    metadata: d.metadata,
    createdAt: typeof d.createdAt === "string" ? d.createdAt : String(d.createdAt),
  }));

  return {
    docs,
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page ?? page,
  };
}
