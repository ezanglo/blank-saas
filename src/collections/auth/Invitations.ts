import type { CollectionConfig } from "payload";

export const Invitations: CollectionConfig = {
  slug: "invitations",
  admin: {
    useAsTitle: "email",
    defaultColumns: [
      "email",
      "organization",
      "status",
      "expiresAt",
      "createdAt",
    ],
  },
  fields: [
    {
      name: "organization",
      type: "relationship",
      relationTo: "organizations",
      required: true,
      index: true,
    },
    { name: "email", type: "email", required: true, index: true },
    { name: "role", type: "text" },
    {
      name: "status",
      type: "text",
      required: true,
      defaultValue: "pending",
    },
    { name: "expiresAt", type: "date", required: true },
    {
      name: "inviter",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
  ],
};
