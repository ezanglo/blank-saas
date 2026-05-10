import { and, asc, eq } from "drizzle-orm";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

/**
 * Canonical app home for signed-in users: active org overview when possible,
 * else first membership, else `/organizations` (browse / create workspace).
 */
export async function workspaceHomePath(input: {
  userId: string;
  organizationId?: string | null;
}): Promise<string> {
  let orgId = input.organizationId ?? null;

  if (orgId) {
    const [valid] = await db
      .select({ slug: schema.organizations.slug })
      .from(schema.members)
      .innerJoin(
        schema.organizations,
        eq(schema.organizations.id, schema.members.organization),
      )
      .where(
        and(
          eq(schema.members.user, input.userId),
          eq(schema.members.organization, orgId),
        ),
      )
      .limit(1);

    if (valid?.slug) return `/organizations/${valid.slug}`;
    orgId = null;
  }

  const [row] = await db
    .select({ slug: schema.organizations.slug })
    .from(schema.members)
    .innerJoin(
      schema.organizations,
      eq(schema.organizations.id, schema.members.organization),
    )
    .where(eq(schema.members.user, input.userId))
    .orderBy(asc(schema.organizations.createdAt))
    .limit(1);

  if (row?.slug) return `/organizations/${row.slug}`;
  return "/organizations";
}
