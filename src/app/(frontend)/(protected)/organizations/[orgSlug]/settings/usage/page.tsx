import { Suspense } from "react";

import { OrgUsagePanel } from "@/components/quota/org-usage-panel";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = { params: Promise<{ orgSlug: string }> };

export default async function OrgSettingsUsagePage({ params }: Props) {
  const { orgSlug } = await params;
  const { org } = await requireOrgContextForSlug(orgSlug);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Usage</h1>
        <p className="text-muted-foreground text-sm">
          Plan limits and current usage for this organization.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground text-sm">Loading…</p>}>
        <OrgUsagePanel orgId={org.id} />
      </Suspense>
    </div>
  );
}
