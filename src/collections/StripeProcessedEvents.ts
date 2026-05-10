import type { CollectionConfig } from "payload";

/** Dedupes Stripe webhook deliveries by `event.id` (Phase 7). */
export const StripeProcessedEvents: CollectionConfig = {
  slug: "stripe-processed-events",
  admin: { hidden: true },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    {
      name: "eventId",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
  ],
};
