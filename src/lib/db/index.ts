import { drizzle } from "@payloadcms/db-postgres/drizzle/node-postgres";
import config from "@payload-config";
import { getPayload } from "payload";

/**
 * Dedicated pool for Better Auth’s `drizzleAdapter` at module init (Finn-style).
 * Prefer `getDb()` in server code that should share Payload’s adapter lifecycle.
 */
export const db = drizzle(process.env.DATABASE_URL as string);

export async function getDb() {
  const payload = await getPayload({ config });
  return payload.db.drizzle;
}
