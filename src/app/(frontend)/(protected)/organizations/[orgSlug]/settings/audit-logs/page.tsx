import { redirect } from "next/navigation";

import { AuditLogsView } from "@/components/audit/audit-logs-view";
import { listAuditLogs } from "@/lib/audit/list";
import { roleAtLeast } from "@/lib/auth/rbac";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgSettingsAuditLogsPage({ params, searchParams }: Props) {
  const { orgSlug } = await params;
  const { org, role } = await requireOrgContextForSlug(orgSlug);
  const sp = await searchParams;

  if (!roleAtLeast(role, "admin")) {
    redirect("/organizations?error=forbidden");
  }

  const action = typeof sp.action === "string" ? sp.action : undefined;
  const actor = typeof sp.actor === "string" ? sp.actor : undefined;
  const from = typeof sp.from === "string" ? sp.from : undefined;
  const to = typeof sp.to === "string" ? sp.to : undefined;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const { docs, totalPages, page: currentPage } = await listAuditLogs({
    organizationId: org.id,
    page,
    action,
    actorSearch: actor,
    from,
    to,
  });

  const listPath = `/organizations/${orgSlug}/settings/audit-logs`;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Audit logs</h1>
        <p className="text-muted-foreground text-sm">
          Activity history for this organization (admin and owner).
        </p>
      </div>
      <AuditLogsView
        orgId={org.id}
        listPath={listPath}
        data={docs}
        totalPages={totalPages}
        page={currentPage}
      />
    </div>
  );
}
