import { NextResponse, type NextRequest } from "next/server";

import { listAuditLogs } from "@/lib/audit/list";
import { requireOrgAdminSession } from "@/lib/auth/require-org-api";
import { getOrgPlan } from "@/lib/org/plan";
import { consumeMonthlyQuota } from "@/lib/quota/check";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ orgId: string }> },
) {
  const { orgId } = await ctx.params;
  const gate = await requireOrgAdminSession(orgId);
  if (!gate.ok) return gate.response;

  const plan = await getOrgPlan(orgId);
  const apiQuota = await consumeMonthlyQuota(orgId, plan, "apiCallsPerMonth", {
    distinctId: gate.session.user.id,
  });
  if (!apiQuota.allowed) {
    return NextResponse.json(
      { error: "quota_exceeded", resource: "apiCallsPerMonth" },
      { status: 429 },
    );
  }

  const { searchParams } = request.nextUrl;
  const action = searchParams.get("action") ?? undefined;
  const actorSearch = searchParams.get("actor") ?? undefined;
  const from = searchParams.get("from") ?? undefined;
  const to = searchParams.get("to") ?? undefined;

  const filename = `audit-log-${orgId}-${new Date().toISOString().slice(0, 10)}.csv`;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const header =
        "createdAt,actorEmail,actorName,action,resourceType,resourceId,ipAddress,metadata\n";
      controller.enqueue(encoder.encode(header));

      const pageSize = 200;
      let page = 1;
      let totalPages = 1;

      try {
        while (page <= totalPages) {
          const batch = await listAuditLogs({
            organizationId: orgId,
            page,
            pageSize,
            action,
            actorSearch,
            from,
            to,
          });
          totalPages = batch.totalPages;
          for (const row of batch.docs) {
            const metaStr =
              row.metadata === undefined || row.metadata === null
                ? ""
                : JSON.stringify(row.metadata);
            const line = [
              csvEscape(row.createdAt),
              csvEscape(row.actorEmail ?? ""),
              csvEscape(row.actorName ?? ""),
              csvEscape(row.action),
              csvEscape(row.resourceType ?? ""),
              csvEscape(row.resourceId ?? ""),
              csvEscape(row.ipAddress ?? ""),
              csvEscape(metaStr),
            ].join(",");
            controller.enqueue(encoder.encode(line + "\n"));
          }
          page += 1;
        }
      } catch (e) {
        console.error("[audit export]", e);
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
