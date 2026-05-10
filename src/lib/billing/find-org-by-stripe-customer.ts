import { eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

export async function findOrgIdByStripeCustomerId(
  stripeCustomerId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ id: schema.organizations.id })
    .from(schema.organizations)
    .where(eq(schema.organizations.stripeCustomerId, stripeCustomerId))
    .limit(1);
  return row?.id ?? null;
}
