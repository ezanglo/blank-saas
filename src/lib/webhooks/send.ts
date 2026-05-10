import { eq } from "@payloadcms/db-postgres/drizzle";
import type { z } from "zod";

import { db } from "@/lib/db";
import { WebhookEvents, type WebhookEventType } from "@/lib/webhooks/events";
import { getSvixClient } from "@/lib/webhooks/svix";
import * as schema from "@/payload-generated-schema";

export async function sendWebhook<T extends WebhookEventType>(
  orgId: string,
  eventType: T,
  payload: z.infer<(typeof WebhookEvents)[T]>,
): Promise<void> {
  WebhookEvents[eventType].parse(payload);

  const [row] = await db
    .select({ svixAppId: schema.organizations.svixAppId })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);

  if (!row?.svixAppId) return;

  const svix = getSvixClient();
  if (!svix) return;

  await svix.message.create(row.svixAppId, {
    eventType,
    payload: payload as Record<string, unknown>,
  });
}

export function sendWebhookFireAndForget<T extends WebhookEventType>(
  orgId: string,
  eventType: T,
  payload: z.infer<(typeof WebhookEvents)[T]>,
): void {
  void sendWebhook(orgId, eventType, payload).catch((err) => {
    console.error("[webhook]", eventType, err);
  });
}
