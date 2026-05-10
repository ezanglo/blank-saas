import { Suspense } from "react";

import { OrgTeamContent } from "@/components/org/org-team-content";
import { canManageMembers } from "@/lib/auth/rbac";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsTeamPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org, session, role } = await requireOrgContextForSlug(orgSlug);

  return (
    <Suspense fallback={<p className="text-muted-foreground text-sm">Loading team…</p>}>
      <OrgTeamContent
        org={{ id: org.id, slug: org.slug }}
        viewerId={session.user.id}
        canManage={canManageMembers(role)}
      />
    </Suspense>
  );
}
