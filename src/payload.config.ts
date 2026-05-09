import path from "node:path";
import { fileURLToPath } from "node:url";

import { postgresAdapter } from "@payloadcms/db-postgres";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { s3Storage } from "@payloadcms/storage-s3";
import { buildConfig } from "payload";
import sharp from "sharp";

import { AuditLogs } from "@/collections/AuditLogs";
import { Accounts } from "@/collections/auth/Accounts";
import { Invitations } from "@/collections/auth/Invitations";
import { Members } from "@/collections/auth/Members";
import { Organizations } from "@/collections/auth/Organizations";
import { Sessions } from "@/collections/auth/Sessions";
import { TwoFactors } from "@/collections/auth/TwoFactors";
import { Users } from "@/collections/auth/Users";
import { Verifications } from "@/collections/auth/Verifications";
import { FeatureFlags } from "@/collections/FeatureFlags";
import { Media } from "@/collections/Media";
import { Permissions } from "@/collections/Permissions";
import { migrations } from "@/migrations";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const bucket = process.env.S3_BUCKET ?? process.env.R2_BUCKET ?? "";
const s3Enabled = Boolean(bucket);
const r2Endpoint = process.env.R2_ACCOUNT_ID
  ? `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
  : undefined;

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname, ".."),
    },
  },
  collections: [
    Users,
    TwoFactors,
    Media,
    Organizations,
    Sessions,
    Accounts,
    Verifications,
    Members,
    Invitations,
    AuditLogs,
    FeatureFlags,
    Permissions,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET ?? "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL ?? "",
    },
    idType: "uuid",
    allowIDOnCreate: true,
    migrationDir: path.resolve(dirname, "migrations"),
    prodMigrations: migrations,
    push: false,
    generateSchemaOutputFile: path.resolve(dirname, "payload-generated-schema.ts"),
  }),
  sharp,
  plugins: [
    s3Storage({
      alwaysInsertFields: true,
      enabled: s3Enabled,
      collections: {
        media: {
          disableLocalStorage: true,
          prefix: "media",
        },
      },
      bucket,
      config: {
        endpoint: process.env.S3_ENDPOINT ?? r2Endpoint,
        region: process.env.S3_REGION ?? process.env.AWS_REGION ?? "auto",
        credentials:
          process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY
            ? {
              accessKeyId: process.env.S3_ACCESS_KEY_ID,
              secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
            }
            : process.env.R2_ACCESS_KEY_ID && process.env.R2_SECRET_ACCESS_KEY
              ? {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
              }
              : undefined,
        forcePathStyle: true,
      },
    }),
  ],
});
