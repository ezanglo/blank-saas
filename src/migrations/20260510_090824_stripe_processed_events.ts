import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "stripe_processed_events" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"event_id" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "stripe_processed_events_id" uuid;
  CREATE UNIQUE INDEX "stripe_processed_events_event_id_idx" ON "stripe_processed_events" USING btree ("event_id");
  CREATE INDEX "stripe_processed_events_updated_at_idx" ON "stripe_processed_events" USING btree ("updated_at");
  CREATE INDEX "stripe_processed_events_created_at_idx" ON "stripe_processed_events" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stripe_processed_events_fk" FOREIGN KEY ("stripe_processed_events_id") REFERENCES "public"."stripe_processed_events"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_stripe_processed_events_id_idx" ON "payload_locked_documents_rels" USING btree ("stripe_processed_events_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "stripe_processed_events" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "stripe_processed_events" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_stripe_processed_events_fk";
  
  DROP INDEX "payload_locked_documents_rels_stripe_processed_events_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "stripe_processed_events_id";`)
}
