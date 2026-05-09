import type { CollectionConfig } from "payload";

export const FeatureFlags: CollectionConfig = {
  slug: "feature-flags",
  admin: { useAsTitle: "key" },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    { name: "key", type: "text", required: true, unique: true, index: true },
    { name: "enabled", type: "checkbox", defaultValue: false },
    { name: "description", type: "text" },
    {
      name: "rolloutPercentage",
      type: "number",
      min: 0,
      max: 100,
      defaultValue: 0,
    },
    { name: "allowlist", type: "json" },
    {
      name: "environments",
      type: "select",
      defaultValue: "all",
      options: [
        { label: "All", value: "all" },
        { label: "Production", value: "production" },
        { label: "Staging", value: "staging" },
        { label: "Development", value: "development" },
      ],
    },
  ],
};
