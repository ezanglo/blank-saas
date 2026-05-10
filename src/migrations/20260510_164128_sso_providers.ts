import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "sso_providers" (
  	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  	"issuer" varchar NOT NULL,
  	"provider_id" varchar NOT NULL,
  	"domain" varchar NOT NULL,
  	"oidc_config" varchar,
  	"saml_config" varchar,
  	"user_id" uuid NOT NULL,
  	"organization_id" uuid,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "sso_providers_id" uuid;
  ALTER TABLE "sso_providers" ADD CONSTRAINT "sso_providers_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "sso_providers" ADD CONSTRAINT "sso_providers_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "sso_providers_provider_id_idx" ON "sso_providers" USING btree ("provider_id");
  CREATE INDEX "sso_providers_domain_idx" ON "sso_providers" USING btree ("domain");
  CREATE INDEX "sso_providers_user_idx" ON "sso_providers" USING btree ("user_id");
  CREATE INDEX "sso_providers_organization_idx" ON "sso_providers" USING btree ("organization_id");
  CREATE INDEX "sso_providers_updated_at_idx" ON "sso_providers" USING btree ("updated_at");
  CREATE INDEX "sso_providers_created_at_idx" ON "sso_providers" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_sso_providers_fk" FOREIGN KEY ("sso_providers_id") REFERENCES "public"."sso_providers"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_sso_providers_id_idx" ON "payload_locked_documents_rels" USING btree ("sso_providers_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_sso_providers_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_sso_providers_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "sso_providers_id";
  DROP TABLE IF EXISTS "sso_providers" CASCADE;`)
}
