import type { CollectionConfig } from "payload";

export const Verifications: CollectionConfig = {
  slug: "user-verifications",
  fields: [
    { name: "identifier", type: "text", required: true, index: true },
    { name: "value", type: "text", required: true },
    { name: "expiresAt", type: "date", required: true },
  ],
};
