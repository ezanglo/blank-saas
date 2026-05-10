import type { ReactNode } from "react";

import { SettingsNav } from "@/components/settings/settings-nav";
import { roleAtLeast } from "@/lib/auth/rbac";
import { resolveWebhooksEnabledFlag } from "@/lib/flags/resolver";
import { isGranularPermissionsEnabled } from "@/lib/permissions/feature";
import { orgScopedAllows } from "@/lib/permissions/org-access";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgSettingsLayout({ children, params }: Props) {
  const { orgSlug } = await params;
  const { org, role, session } = await requireOrgContextForSlug(orgSlug);

  const isAdmin = roleAtLeast(role, "admin");
  const isOwner = role === "owner";
  const granularFeatureOn = isGranularPermissionsEnabled();

  let showWebhooksFeature = false;
  if (isAdmin || granularFeatureOn) {
    try {
      showWebhooksFeature = await resolveWebhooksEnabledFlag();
    } catch {
      showWebhooksFeature = true;
    }
  }

  let showBillingNav = isAdmin;
  let showAuditLogsNav = isAdmin;
  let showWebhooksNav = isAdmin && showWebhooksFeature;
  let showSsoNav = isOwner;
  let showPermissionsNav = isAdmin && granularFeatureOn;

  if (granularFeatureOn) {
    const granBase = {
      organizationId: org.id,
      userId: session.user.id,
      userRole: role,
    };
    if (!showBillingNav) {
      showBillingNav = await orgScopedAllows({
        ...granBase,
        rbacAllows: false,
        resourceType: "org_billing",
        action: "read",
      });
    }
    if (!showAuditLogsNav) {
      showAuditLogsNav = await orgScopedAllows({
        ...granBase,
        rbacAllows: false,
        resourceType: "org_audit_logs",
        action: "read",
      });
    }
    if (!showWebhooksNav) {
      const delegateWebhooks = await orgScopedAllows({
        ...granBase,
        rbacAllows: false,
        resourceType: "org_webhooks",
        action: "read",
      });
      showWebhooksNav = delegateWebhooks && showWebhooksFeature;
    }
    if (!showSsoNav) {
      showSsoNav = await orgScopedAllows({
        ...granBase,
        rbacAllows: false,
        resourceType: "org_sso",
        action: "configure",
      });
    }
    if (!showPermissionsNav) {
      showPermissionsNav = await orgScopedAllows({
        ...granBase,
        rbacAllows: false,
        resourceType: "org_permissions",
        action: "read",
      });
    }
  }

  return (
    <div className="w-full px-4 py-8 sm:px-0">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Organization Settings</h1>
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-12">
        <aside className="w-full lg:w-64 lg:shrink-0">
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <SettingsNav
              orgSlug={orgSlug}
              showBillingNav={showBillingNav}
              showAuditLogsNav={showAuditLogsNav}
              showWebhooksNav={showWebhooksNav}
              showSsoNav={showSsoNav}
              showPermissionsNav={showPermissionsNav}
            />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
