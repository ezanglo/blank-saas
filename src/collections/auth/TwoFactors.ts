import type { CollectionConfig } from "payload";

export const TwoFactors: CollectionConfig = {
  slug: "two-factors",
  admin: { hidden: true },
  fields: [
    {
      name: "userId",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
      maxDepth: 0,
    },
    { name: "secret", type: "text", required: true },
    {
      name: "backupCodes",
      type: "text",
      required: true,
      admin: { description: "Encrypted backup codes (Better Auth)." },
    },
    { name: "verified", type: "checkbox", defaultValue: true },
  ],
};
