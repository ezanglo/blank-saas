import { and, eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

/** Email addresses for organization owners (billing alerts). */
export async function getOwnerEmailsForOrg(organizationId: string): Promise<string[]> {
  const rows = await db
    .select({ email: schema.users.email })
    .from(schema.members)
    .innerJoin(schema.users, eq(schema.members.user, schema.users.id))
    .where(
      and(
        eq(schema.members.organization, organizationId),
        eq(schema.members.role, "owner"),
      ),
    );
  return rows.map((r) => r.email).filter((e): e is string => Boolean(e?.trim()));
}
