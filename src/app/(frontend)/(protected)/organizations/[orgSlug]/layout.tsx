import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { getMemberRole } from "@/lib/auth/require-org";
import { redirectWorkspaceHome } from "@/lib/org/redirect-workspace-home";
import { getOrganizationBySlug } from "@/lib/org/load-org";

type Props = {
  children: ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function OrganizationSlugLayout({ children, params }: Props) {
  const { orgSlug } = await params;
  const org = await getOrganizationBySlug(orgSlug);
  if (!org) redirect("/organizations");

  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session) redirect("/sign-in");

  if (!(await getMemberRole(org.id, session.user.id))) await redirectWorkspaceHome(session);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      {children}
    </div>
  );
}
