import type { CollectionConfig } from "payload";

/**
 * Better Auth `@better-auth/sso` provider rows (`model: "ssoProvider"`).
 * Defined here so Payload owns the table + migrations (`payload-generated-schema.ts`).
 */
export const SsoProviders: CollectionConfig = {
  slug: "sso-providers",
  admin: { hidden: true },
  access: {
    create: () => false,
    read: () => false,
    update: () => false,
    delete: () => false,
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data && typeof data.domain === "string") {
          data.domain = data.domain.trim().toLowerCase();
        }
      },
    ],
  },
  fields: [
    { name: "issuer", type: "text", required: true },
    {
      name: "providerId",
      type: "text",
      required: true,
      unique: true,
      index: true,
    },
    {
      name: "domain",
      type: "text",
      required: true,
      index: true,
    },
    {
      name: "oidcConfig",
      label: "OIDC config (JSON)",
      type: "textarea",
      required: false,
    },
    {
      name: "samlConfig",
      label: "SAML config (JSON)",
      type: "textarea",
      required: false,
    },
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "organization",
      type: "relationship",
      relationTo: "organizations",
      required: false,
      index: true,
    },
  ],
};
