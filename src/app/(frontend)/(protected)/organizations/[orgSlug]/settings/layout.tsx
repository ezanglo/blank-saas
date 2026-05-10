import type { ReactNode } from "react";

import { SettingsNav } from "@/components/settings/settings-nav";
import { roleAtLeast } from "@/lib/auth/rbac";
import { resolveWebhooksEnabledFlag } from "@/lib/flags/resolver";
import { requireOrgContextForSlug } from "@/lib/org/require-active-org";

type Props = {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgSettingsLayout({ children, params }: Props) {
  const { orgSlug } = await params;
  const { role } = await requireOrgContextForSlug(orgSlug);

  const isAdmin = roleAtLeast(role, "admin");
  let showWebhooks = false;
  if (isAdmin) {
    try {
      showWebhooks = await resolveWebhooksEnabledFlag();
    } catch {
      showWebhooks = true;
    }
  }

  return (
    <div className="w-full px-4 py-8 sm:px-0">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Organization Settings</h1>
      <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:gap-12">
        <aside className="w-full lg:w-64 lg:shrink-0">
          <div className="flex flex-col gap-4 lg:sticky lg:top-24">
            <SettingsNav orgSlug={orgSlug} isAdmin={isAdmin} showWebhooks={showWebhooks} />
          </div>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
