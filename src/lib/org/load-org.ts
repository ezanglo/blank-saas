import { eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

export async function getOrganizationBySlug(slug: string) {
  const [row] = await db
    .select({
      id: schema.organizations.id,
      name: schema.organizations.name,
      slug: schema.organizations.slug,
      plan: schema.organizations.plan,
    })
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, slug))
    .limit(1);
  return row ?? null;
}
