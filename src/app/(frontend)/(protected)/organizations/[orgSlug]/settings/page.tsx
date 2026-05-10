import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { OrgSettingsForm } from "@/components/org/org-settings-form";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { canUpdateOrganization } from "@/lib/auth/rbac";
import { getMemberRole } from "@/lib/auth/require-org";
import { redirectWorkspaceHome } from "@/lib/org/redirect-workspace-home";
import { getOrganizationBySlug } from "@/lib/org/load-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrganizationSettingsPage({ params }: Props) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/organizations");

  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session) redirect("/sign-in");

  const role = await getMemberRole(org.id, session.user.id);
  if (!role) await redirectWorkspaceHome(session);
  if (!canUpdateOrganization(role)) redirect(`/organizations/${orgSlug}`);

  return <OrgSettingsForm org={{ id: org.id, name: org.name, slug: org.slug }} viewerRole={role} />;
}
