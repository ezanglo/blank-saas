import { eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";

const orgSelect = {
  id: schema.organizations.id,
  name: schema.organizations.name,
  slug: schema.organizations.slug,
  plan: schema.organizations.plan,
} as const;

export async function getOrganizationBySlug(slug: string) {
  const [row] = await db
    .select(orgSelect)
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, slug))
    .limit(1);
  return row ?? null;
}

export async function getOrganizationById(id: string) {
  const [row] = await db
    .select(orgSelect)
    .from(schema.organizations)
    .where(eq(schema.organizations.id, id))
    .limit(1);
  return row ?? null;
}
