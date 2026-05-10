import { and, eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import { activeOrganizationIdFromSession } from "@/lib/org/session-active-org";
import * as schema from "@/payload-generated-schema";

/** Org id for user-scoped audits when the action is not tied to a specific org (e.g. password change). */
export async function resolveAuditOrganizationIdForSession(
  session: {
    session?: {
      activeOrganizationId?: string | null;
      activeOrganization?: string | null;
    };
    user: { id: string };
  } | null,
): Promise<string | null> {
  if (!session?.user?.id) return null;
  const preferred = activeOrganizationIdFromSession(session);
  if (preferred) {
    const [m] = await db
      .select({ id: schema.members.id })
      .from(schema.members)
      .where(
        and(
          eq(schema.members.user, session.user.id),
          eq(schema.members.organization, preferred),
        ),
      )
      .limit(1);
    if (m) return preferred;
  }
  const [first] = await db
    .select({ organizationId: schema.members.organization })
    .from(schema.members)
    .where(eq(schema.members.user, session.user.id))
    .limit(1);
  return first?.organizationId ?? null;
}
