import { redirect } from "next/navigation";

import { OrgSsoPanel } from "@/components/org/org-sso-panel";
import { canConfigureSso } from "@/lib/auth/rbac";
import { loadOrgSamlSummaryForSettings } from "@/lib/actions/sso";
import { orgScopedAllows } from "@/lib/permissions/org-access";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsSsoPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org, role, session } = await requireOrgContextForSlug(orgSlug);

  const canAccess = await orgScopedAllows({
    organizationId: org.id,
    userId: session.user.id,
    userRole: role,
    rbacAllows: canConfigureSso(role),
    resourceType: "org_sso",
    action: "configure",
  });

  if (!canAccess) {
    redirect("/organizations?error=forbidden");
  }

  const summary = await loadOrgSamlSummaryForSettings(org.id);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Single sign-on</h1>
        <p className="text-muted-foreground text-sm">
          SAML 2.0 SSO for your organization (owners by role; delegated SAML admins when granular permissions
          are enabled).
        </p>
      </div>
      <OrgSsoPanel orgId={org.id} orgSlug={org.slug} summary={summary} />
    </div>
  );
}
