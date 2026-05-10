import { redirect } from "next/navigation";

import { OrgPermissionsView } from "@/components/permissions/org-permissions-view";
import { roleAtLeast } from "@/lib/auth/rbac";
import { isGranularPermissionsEnabled } from "@/lib/permissions/feature";
import { listOrgPermissions } from "@/lib/permissions/list";
import { orgScopedAllows } from "@/lib/permissions/org-access";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OrgSettingsPermissionsPage({ params, searchParams }: Props) {
  if (!isGranularPermissionsEnabled()) {
    redirect("/organizations?error=feature_disabled");
  }

  const { orgSlug } = await params;
  const { org, role, session } = await requireOrgContextForSlug(orgSlug);
  const sp = await searchParams;

  const canView = await orgScopedAllows({
    organizationId: org.id,
    userId: session.user.id,
    userRole: role,
    rbacAllows: roleAtLeast(role, "admin"),
    resourceType: "org_permissions",
    action: "read",
  });

  if (!canView) {
    redirect("/organizations?error=forbidden");
  }

  const resourceType = typeof sp.resourceType === "string" ? sp.resourceType : undefined;
  const resourceId = typeof sp.resourceId === "string" ? sp.resourceId : undefined;
  const subjectId = typeof sp.subjectId === "string" ? sp.subjectId : undefined;
  const pageRaw = typeof sp.page === "string" ? Number.parseInt(sp.page, 10) : 1;
  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;

  const { docs, totalPages, page: currentPage } = await listOrgPermissions({
    organizationId: org.id,
    resourceType,
    resourceId,
    subjectId,
    page,
  });

  const listPath = `/organizations/${orgSlug}/settings/permissions`;
  const canMutate = role === "owner";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
        <p className="text-muted-foreground text-sm">
          Resource-level access for this organization (granular layer on top of roles). Owners can
          grant and revoke; admins can view and filter.
        </p>
      </div>
      <OrgPermissionsView
        orgId={org.id}
        orgSlug={orgSlug}
        listPath={listPath}
        data={docs}
        totalPages={totalPages}
        page={currentPage}
        canMutate={canMutate}
      />
    </div>
  );
}
