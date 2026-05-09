import { drizzle } from "@payloadcms/db-postgres/drizzle/node-postgres";

export const db = drizzle(process.env.DATABASE_URL as string);
