import type { CollectionConfig } from "payload";

export const Sessions: CollectionConfig = {
  slug: "user-sessions",
  fields: [
    {
      name: "userId",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "token",
      type: "text",
      required: true,
      unique: true,
    },
    {
      name: "expiresAt",
      type: "date",
      required: true,
    },
    { name: "ipAddress", type: "text", index: true },
    { name: "userAgent", type: "text" },
    { name: "impersonatedBy", type: "text" },
    {
      name: "activeOrganization",
      type: "relationship",
      relationTo: "organizations",
    },
  ],
};
