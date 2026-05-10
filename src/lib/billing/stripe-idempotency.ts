import config from "@payload-config";
import { getPayload } from "payload";

export function isUniqueConstraintViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const o = err as Record<string, unknown>;
  if (o.code === "23505") return true;
  const msg = String(o.message ?? "");
  if (/duplicate|unique/i.test(msg)) return true;
  return false;
}

/** Inserts `eventId` once; returns false if this delivery was already processed. */
export async function tryClaimStripeEvent(eventId: string): Promise<boolean> {
  const payload = await getPayload({ config });
  try {
    await payload.create({
      collection: "stripe-processed-events",
      data: { eventId },
      overrideAccess: true,
    });
    return true;
  } catch (err) {
    if (isUniqueConstraintViolation(err)) {
      return false;
    }
    throw err;
  }
}
