import { redirect } from "next/navigation";

import { workspaceHomePath } from "@/lib/org/workspace-home";
import { sessionActiveOrg } from "@/lib/proxy-guards";

type SessionLike =
  | { user: { id: string }; session: Record<string, unknown> | null | undefined }
  | null;

/** Use when guarding org routes — sends the member to their current workspace overview (or `/organizations`). */
export async function redirectWorkspaceHome(session: SessionLike): Promise<never> {
  if (!session?.user?.id) {
    redirect("/sign-in");
  }
  const path = await workspaceHomePath({
    userId: session.user.id,
    organizationId: sessionActiveOrg(session),
  });
  redirect(path);
}
