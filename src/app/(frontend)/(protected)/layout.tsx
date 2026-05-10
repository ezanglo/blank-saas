import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PostHogWorkspaceGroup } from "@/components/analytics/posthog-workspace-group";
import { PostHogIdentify } from "@/lib/analytics/client";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    >
      <PostHogIdentify
        userId={session.user.id}
        email={session.user.email}
        name={session.user.name}
      />
      <PostHogWorkspaceGroup />
      {children}
    </DashboardShell>
  );
}
