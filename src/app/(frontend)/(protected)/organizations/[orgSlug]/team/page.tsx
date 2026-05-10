import { Suspense } from "react";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { OrgTeamContent } from "@/components/org/org-team-content";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { canManageMembers } from "@/lib/auth/rbac";
import { getMemberRole } from "@/lib/auth/require-org";
import { redirectWorkspaceHome } from "@/lib/org/redirect-workspace-home";
import { getOrganizationBySlug } from "@/lib/org/load-org";

type Props = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrganizationTeamPage({ params }: Props) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/organizations");

  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session) redirect("/sign-in");

  const role = await getMemberRole(org.id, session.user.id);
  if (!role) await redirectWorkspaceHome(session);

  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading team…</p>}>
      <OrgTeamContent
        org={{ id: org.id, slug: org.slug }}
        viewerId={session.user.id}
        canManage={canManageMembers(role)}
      />
    </Suspense>
  );
}
