import { redirect } from "next/navigation";

import { OrgSettingsForm } from "@/components/org/org-settings-form";
import { canUpdateOrganization } from "@/lib/auth/rbac";
import { orgScopedAllows } from "@/lib/permissions/org-access";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsGeneralPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org, role, session } = await requireOrgContextForSlug(orgSlug);

  const canEdit = await orgScopedAllows({
    organizationId: org.id,
    userId: session.user.id,
    userRole: role,
    rbacAllows: canUpdateOrganization(role),
    resourceType: "org_settings",
    action: "write",
  });

  if (!canEdit) {
    redirect(`/organizations/${org.slug}`);
  }

  return <OrgSettingsForm org={{ id: org.id, name: org.name, slug: org.slug }} viewerRole={role} />;
}
