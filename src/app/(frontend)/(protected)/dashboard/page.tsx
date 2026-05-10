import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";
import { workspaceHomePath } from "@/lib/org/workspace-home";
import { sessionActiveOrg } from "@/lib/proxy-guards";

/** Legacy `/dashboard` URL; forwards to active org overview (or `/organizations`). */
export default async function DashboardAliasPage() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  redirect(
    await workspaceHomePath({
      userId: session.user.id,
      organizationId: sessionActiveOrg(session),
    }),
  );
}
