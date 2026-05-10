import { redirect } from "next/navigation";

import { OrgSettingsForm } from "@/components/org/org-settings-form";
import { canUpdateOrganization } from "@/lib/auth/rbac";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsGeneralPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org, role } = await requireOrgContextForSlug(orgSlug);

  if (!canUpdateOrganization(role)) {
    redirect(`/organizations/${org.slug}`);
  }

  return <OrgSettingsForm org={{ id: org.id, name: org.name, slug: org.slug }} viewerRole={role} />;
}
