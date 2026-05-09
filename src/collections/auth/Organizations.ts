import type { CollectionConfig } from "payload";

export const Organizations: CollectionConfig = {
  slug: "organizations",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "slug", "plan", "createdAt"],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "logo",
      type: "upload",
      relationTo: "media",
      filterOptions: { mimeType: { contains: "image" } },
    },
    { name: "metadata", type: "text" },
    {
      name: "plan",
      type: "select",
      required: true,
      defaultValue: "free",
      options: [
        { label: "Free", value: "free" },
        { label: "Pro", value: "pro" },
        { label: "Enterprise", value: "enterprise" },
      ],
    },
    { name: "svixAppId", type: "text" },
    { name: "stripeCustomerId", type: "text" },
    { name: "stripeSubscriptionId", type: "text" },
    {
      name: "stripeSubscriptionStatus",
      type: "select",
      options: [
        { label: "Active", value: "active" },
        { label: "Trialing", value: "trialing" },
        { label: "Past due", value: "past_due" },
        { label: "Canceled", value: "canceled" },
        { label: "Unpaid", value: "unpaid" },
      ],
    },
    { name: "stripePriceId", type: "text" },
    { name: "samlConnectionId", type: "text" },
  ],
};
