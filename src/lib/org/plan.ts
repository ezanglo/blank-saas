import { eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import type { PlanKey } from "@/lib/quota/plans";
import * as schema from "@/payload-generated-schema";

export async function getOrgPlan(organizationId: string): Promise<PlanKey> {
  const [row] = await db
    .select({ plan: schema.organizations.plan })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);
  const p = row?.plan;
  if (p === "free" || p === "pro" || p === "enterprise") return p;
  return "free";
}
