import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  slug: "media",
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: "alt", type: "text" },
    {
      name: "prefix",
      type: "text",
      admin: { readOnly: true, hidden: true },
    },
  ],
  upload: {
    mimeTypes: ["image/jpeg", "image/png", "image/webp"],
    imageSizes: [
      { name: "thumbnail", width: 150, height: 150, position: "centre" },
      { name: "card", width: 400, height: 400, position: "centre" },
    ],
  },
};
