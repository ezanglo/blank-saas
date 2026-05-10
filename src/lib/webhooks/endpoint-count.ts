import { eq } from "@payloadcms/db-postgres/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/payload-generated-schema";
import { listWebhookEndpoints } from "@/lib/webhooks/svix";

/** Current outbound webhook endpoint count for quota / usage UI. */
export async function countWebhookEndpointsForOrg(organizationId: string): Promise<number> {
  const [row] = await db
    .select({ svixAppId: schema.organizations.svixAppId })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);
  if (!row?.svixAppId) return 0;
  try {
    const endpoints = await listWebhookEndpoints(row.svixAppId);
    return endpoints.length;
  } catch {
    return 0;
  }
}
