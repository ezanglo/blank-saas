import type { CollectionConfig } from "payload";

export const Members: CollectionConfig = {
  slug: "members",
  admin: {
    useAsTitle: "user",
    defaultColumns: ["organization", "user", "role", "createdAt"],
  },
  fields: [
    {
      name: "organization",
      type: "relationship",
      relationTo: "organizations",
      required: true,
      index: true,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "member",
      options: [
        { label: "Owner", value: "owner" },
        { label: "Admin", value: "admin" },
        { label: "Member", value: "member" },
      ],
    },
  ],
};
