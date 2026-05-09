import type { CollectionConfig } from "payload";

export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: {
    useAsTitle: "action",
    defaultColumns: ["action", "organization", "actorEmail", "createdAt"],
  },
  fields: [
    {
      name: "organization",
      type: "relationship",
      relationTo: "organizations",
      required: true,
      index: true,
    },
    { name: "actorId", type: "text", required: true, index: true },
    { name: "actorEmail", type: "text" },
    { name: "actorName", type: "text" },
    { name: "action", type: "text", required: true, index: true },
    { name: "resourceType", type: "text" },
    { name: "resourceId", type: "text" },
    { name: "metadata", type: "json" },
    { name: "ipAddress", type: "text" },
    { name: "userAgent", type: "text" },
  ],
};
