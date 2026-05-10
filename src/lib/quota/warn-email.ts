import { and, eq } from "@payloadcms/db-postgres/drizzle";
import { Redis } from "@upstash/redis";

import { db } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email";
import QuotaWarningEmail from "@/lib/email/templates/quota-warning";
import { getRedisForQuota } from "@/lib/quota/limiter";
import * as schema from "@/payload-generated-schema";
import IORedis from "ioredis";

const WARN_TTL_SEC = 60 * 60 * 24 * 30;

function resourceLabel(resource: string): string {
  switch (resource) {
    case "apiCallsPerMonth":
      return "API calls (monthly)";
    case "membersPerOrg":
      return "members";
    case "storageGb":
      return "storage (GB)";
    case "webhookEndpoints":
      return "webhook endpoints";
    default:
      return resource;
  }
}

async function warnAlreadySent(redis: IORedis | Redis, key: string): Promise<boolean> {
  if (redis instanceof Redis) {
    const v = await redis.get(key);
    return v != null;
  }
  const v = await redis.get(key);
  return v != null;
}

async function markWarnSent(redis: IORedis | Redis, key: string): Promise<void> {
  if (redis instanceof Redis) {
    await redis.set(key, "1", { ex: WARN_TTL_SEC });
  } else {
    await redis.set(key, "1", "EX", WARN_TTL_SEC);
  }
}

async function ownerEmailForOrg(organizationId: string): Promise<string | null> {
  const [row] = await db
    .select({ email: schema.users.email })
    .from(schema.members)
    .innerJoin(schema.users, eq(schema.members.user, schema.users.id))
    .where(
      and(eq(schema.members.organization, organizationId), eq(schema.members.role, "owner")),
    )
    .limit(1);
  return row?.email ?? null;
}

/** One email per org+resource per billing window (PRD §16.4). */
export async function maybeSendQuotaWarningEmail(
  orgId: string,
  resource: string,
  remaining: number,
  limit: number,
): Promise<void> {
  if (limit <= 0 || !Number.isFinite(limit)) return;

  const redis = getRedisForQuota();
  if (!redis) return;

  const key = `quota:warn:${orgId}:${resource}`;
  if (await warnAlreadySent(redis, key)) return;

  const [org] = await db
    .select({ name: schema.organizations.name })
    .from(schema.organizations)
    .where(eq(schema.organizations.id, orgId))
    .limit(1);
  const to = await ownerEmailForOrg(orgId);
  if (!to) return;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const percentUsed = ((limit - remaining) / limit) * 100;

  await sendTransactionalEmail({
    to,
    subject: `Usage alert: ${org?.name ?? "Your organization"}`,
    react: QuotaWarningEmail({
      orgName: org?.name ?? "Your organization",
      resource: resourceLabel(resource),
      percentUsed,
      upgradeUrl: `${appUrl}/pricing`,
    }),
    text: `Usage for ${resourceLabel(resource)} is at about ${Math.round(percentUsed)}%. Upgrade: ${appUrl}/pricing`,
  });

  await markWarnSent(redis, key);
}
