import { MigrateDownArgs, MigrateUpArgs, sql } from "@payloadcms/db-postgres";

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "permissions_resource_type_idx" ON "permissions" USING btree ("resource_type");
    CREATE INDEX IF NOT EXISTS "permissions_resource_id_idx" ON "permissions" USING btree ("resource_id");
  `);
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "permissions_resource_type_idx";
    DROP INDEX IF EXISTS "permissions_resource_id_idx";
  `);
}
