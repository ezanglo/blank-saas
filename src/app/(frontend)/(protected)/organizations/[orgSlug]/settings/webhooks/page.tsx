import { redirect } from "next/navigation";

import { OrgWebhooksPanel } from "@/components/org/org-webhooks-panel";
import { roleAtLeast } from "@/lib/auth/rbac";
import { orgScopedAllows } from "@/lib/permissions/org-access";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";
import { getSvixAppIdForOrg } from "@/lib/webhooks/provision";
import { getSvixClient, listWebhookEndpoints } from "@/lib/webhooks/svix";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsWebhooksPage({ params }: Props) {
  const { orgSlug } = await params;
  const { org, role, session } = await requireOrgContextForSlug(orgSlug);

  const canAccess = await orgScopedAllows({
    organizationId: org.id,
    userId: session.user.id,
    userRole: role,
    rbacAllows: roleAtLeast(role, "admin"),
    resourceType: "org_webhooks",
    action: "read",
  });

  if (!canAccess) {
    redirect("/organizations?error=forbidden");
  }

  const svixConfigured = Boolean(getSvixClient());
  const appId = await getSvixAppIdForOrg(org.id);
  const endpoints =
    svixConfigured && appId ? await listWebhookEndpoints(appId) : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Webhooks</h1>
        <p className="text-muted-foreground text-sm">
          Register HTTPS endpoints to receive organization events via Svix.
        </p>
      </div>
      <OrgWebhooksPanel
        orgId={org.id}
        orgSlug={org.slug}
        endpoints={endpoints}
        svixConfigured={svixConfigured}
      />
    </div>
  );
}
