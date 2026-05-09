import config from "@payload-config";
import { getPayload } from "payload";

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

/**
 * Writes an audit row (Bypasses Payload `audit-logs` create access.)
 * Call after successful Server Actions that mutate org data.
 */
export async function createAuditLog(input: {
  organizationId: string;
  actorId: string;
  actorEmail?: string | null;
  actorName?: string | null;
  action: string;
  resourceType?: string | null;
  resourceId?: string | null;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}) {
  const payload = await getPayload({ config });
  await payload.create({
    collection: "audit-logs",
    data: {
      organization: input.organizationId,
      actorId: input.actorId,
      actorEmail: input.actorEmail ?? undefined,
      actorName: input.actorName ?? undefined,
      action: input.action,
      resourceType: input.resourceType ?? undefined,
      resourceId: input.resourceId ?? undefined,
      metadata: toPayloadJsonField(input.metadata),
      ipAddress: input.ipAddress ?? undefined,
      userAgent: input.userAgent ?? undefined,
    },
    overrideAccess: true,
  });
}
