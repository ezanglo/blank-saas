import { eq } from "@payloadcms/db-postgres/drizzle";
import { count } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

export async function countOrgMembers(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ c: count() })
    .from(schema.members)
    .where(eq(schema.members.organization, organizationId));
  return Number(row?.c ?? 0);
}
