"use server";

import { sql } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";
import { normalizeEmailDomain } from "@/lib/sso/saml-metadata";

export async function domainHasSamlSsoAction(emailOrDomain: string): Promise<boolean> {
  const domain = normalizeEmailDomain(emailOrDomain);
  if (!domain) return false;

  const [row] = await db
    .select({ id: schema.sso_providers.id })
    .from(schema.sso_providers)
    .where(sql`lower(${schema.sso_providers.domain}) = ${domain}`)
    .limit(1);

  return Boolean(row);
}
