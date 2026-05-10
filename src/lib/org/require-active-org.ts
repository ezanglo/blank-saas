import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { getMemberRole } from "@/lib/auth/require-org";
import { getOrganizationById } from "@/lib/org/load-org";
import { activeOrganizationIdFromSession } from "@/lib/org/session-active-org";
import { workspaceHomePath } from "@/lib/org/workspace-home";

/** Active org from session (Better Auth active organization). */
export async function requireActiveOrgContext() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session?.user?.id) redirect("/sign-in");

  let orgId = activeOrganizationIdFromSession(session);
  if (!orgId) {
    redirect(
      await workspaceHomePath({
        userId: session.user.id,
        organizationId: null,
      }),
    );
  }

  const org = await getOrganizationById(orgId);
  if (!org) redirect("/organizations");

  const role = await getMemberRole(org.id, session.user.id);
  if (!role) {
    redirect(
      await workspaceHomePath({
        userId: session.user.id,
        organizationId: null,
      }),
    );
  }

  return { session, org, role };
}

/** For `/organizations/[orgSlug]/settings/*` — active org must match the URL slug. */
export async function requireOrgContextForSlug(orgSlug: string) {
  const ctx = await requireActiveOrgContext();
  if (ctx.org.slug !== orgSlug) {
    redirect(`/organizations/${ctx.org.slug}/settings/general`);
  }
  return ctx;
}
