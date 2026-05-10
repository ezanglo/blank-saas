import config from "@payload-config";
import { eq } from "@payloadcms/db-postgres/drizzle";
import { getPayload } from "payload";

import { db } from "@/lib/db";
import { getSvixClient } from "@/lib/webhooks/svix";
import * as schema from "@/payload-generated-schema";

export async function provisionSvixApplication(params: {
  organizationId: string;
  name: string;
}): Promise<void> {
  const svix = getSvixClient();
  if (!svix) return;

  try {
    const app = await svix.application.create({
      name: params.name,
      uid: params.organizationId,
    });

    const payload = await getPayload({ config });
    await payload.update({
      collection: "organizations",
      id: params.organizationId,
      data: { svixAppId: app.id },
      overrideAccess: true,
    });
  } catch (err) {
    console.error("[svix] provisionSvixApplication", err);
  }
}

export async function deleteSvixApplication(svixAppId: string | null | undefined): Promise<void> {
  if (!svixAppId) return;
  const svix = getSvixClient();
  if (!svix) return;
  try {
    await svix.application.delete(svixAppId);
  } catch (err) {
    console.error("[svix] deleteSvixApplication", err);
  }
}

export async function getSvixAppIdForOrg(organizationId: string): Promise<string | null> {
  const [row] = await db
    .select({ svixAppId: schema.organizations.svixAppId })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1);
  return row?.svixAppId ?? null;
}
