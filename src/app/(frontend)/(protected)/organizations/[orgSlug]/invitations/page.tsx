import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { OrgInvitationsPanel } from "@/components/org/org-invitations-panel";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { getMemberRole } from "@/lib/auth/require-org";
import { canManageMembers } from "@/lib/auth/rbac";
import { getOrganizationBySlug } from "@/lib/org/load-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrganizationInvitationsPage({ params }: Props) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/organizations");

  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session) redirect("/sign-in");

  const role = await getMemberRole(org.id, session.user.id);
  if (!role) redirect("/dashboard");

  return <OrgInvitationsPanel org={{ id: org.id }} canManage={canManageMembers(role)} />;
}
