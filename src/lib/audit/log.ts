import config from "@payload-config";
import type { z } from "zod";
import { getPayload } from "payload";

import { AuditEvents, type AuditAction } from "@/lib/audit/events";

type PayloadJsonValue =
  | string
  | number
  | boolean
  | { [k: string]: unknown }
  | unknown[]
  | null
  | undefined;

function toPayloadJsonField(value: unknown): PayloadJsonValue {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (Array.isArray(value)) return value;
  if (typeof value === "object") return value as { [k: string]: unknown };
  return undefined;
}

export type CreateAuditLogBase = {
  organizationId: string;
  actorId: string;
  actorEmail?: string | null;
  actorName?: string | null;
  resourceType?: string | null;
  resourceId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
};

/**
 * Writes an audit row (bypasses Payload `audit-logs` create access.)
 */
export async function createAuditLog<T extends AuditAction>(
  action: T,
  data: CreateAuditLogBase & {
    metadata?: z.infer<(typeof AuditEvents)[T]>;
  },
): Promise<void> {
  const schema = AuditEvents[action];
  const metadata =
    data.metadata === undefined
      ? undefined
      : schema.parse(data.metadata);

  const payload = await getPayload({ config });
  await payload.create({
    collection: "audit-logs",
    data: {
      organization: data.organizationId,
      actorId: data.actorId,
      actorEmail: data.actorEmail ?? undefined,
      actorName: data.actorName ?? undefined,
      action,
      resourceType: data.resourceType ?? undefined,
      resourceId: data.resourceId ?? undefined,
      metadata: toPayloadJsonField(metadata),
      ipAddress: data.ipAddress ?? undefined,
      userAgent: data.userAgent ?? undefined,
    },
    overrideAccess: true,
  });
}

/** Audit failures must not break user mutations (phase-06). */
export function fireAndForgetAuditLog<T extends AuditAction>(
  action: T,
  data: CreateAuditLogBase & {
    metadata?: z.infer<(typeof AuditEvents)[T]>;
  },
): void {
  void createAuditLog(action, data).catch((err) => {
    console.error("[audit]", action, err);
  });
}
