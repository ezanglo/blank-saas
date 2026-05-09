import type { CollectionConfig } from "payload";

export const Permissions: CollectionConfig = {
  slug: "permissions",
  admin: { useAsTitle: "subjectId" },
  fields: [
    {
      name: "organization",
      type: "relationship",
      relationTo: "organizations",
      required: true,
      index: true,
    },
    { name: "subjectId", type: "text", required: true, index: true },
    {
      name: "subjectType",
      type: "select",
      required: true,
      options: [
        { label: "User", value: "user" },
        { label: "Org role", value: "org_role" },
      ],
    },
    { name: "resourceType", type: "text", required: true },
    { name: "resourceId", type: "text", required: true },
    { name: "actions", type: "json", required: true },
    { name: "grantedBy", type: "text" },
    { name: "expiresAt", type: "date" },
  ],
};
