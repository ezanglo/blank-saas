import { auth } from "../../lib/auth";
import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "email" },
  auth: {
    disableLocalStrategy: true,
    strategies: [
      {
        name: "better-auth",
        authenticate: async ({ headers, payload }) => {
          try {
            const userSession = await auth.api.getSession({ headers });

            if (!userSession?.user) return { user: null };

            const userData = await payload.findByID({
              collection: "users",
              id: userSession.user.id,
            });

            return {
              user: {
                ...userData,
                collection: "users",
              },
            };
          } catch (err) {
            payload.logger.error(err);
            return { user: null };
          }
        },
      },
    ],
  },
  endpoints: [
    {
      path: "/logout",
      method: "post",
      handler: async (req) => {
        await auth.api.signOut({ headers: req.headers });
        return Response.json(
          { message: "Token revoked successfully" },
          { status: 200, headers: req.headers },
        );
      },
    },
  ],
  access: {
    admin: ({ req }) => req.user?.role === "admin",
    read: ({ req }) => req.user?.role === "admin",
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
  },
  hooks: {
    beforeDelete: [
      async ({ id, req }) => {
        await req.payload.delete({
          collection: "user-sessions",
          where: { userId: { equals: id } },
          req,
          overrideAccess: true,
        });
        await req.payload.delete({
          collection: "user-accounts",
          where: { userId: { equals: id } },
          req,
          overrideAccess: true,
        });
        await req.payload.delete({
          collection: "two-factors",
          where: { userId: { equals: id } },
          req,
          overrideAccess: true,
        });
        await req.payload.delete({
          collection: "members",
          where: { user: { equals: id } },
          req,
          overrideAccess: true,
        });
        await req.payload.delete({
          collection: "invitations",
          where: { inviter: { equals: id } },
          req,
          overrideAccess: true,
        });
        const ssoProviders = await req.payload.find({
          collection: "sso-providers",
          where: { user: { equals: id } },
          limit: 500,
          depth: 0,
          req,
          overrideAccess: true,
        });
        for (const row of ssoProviders.docs) {
          const providerId =
            typeof row.providerId === "string" ? row.providerId : null;
          if (providerId) {
            const orgs = await req.payload.find({
              collection: "organizations",
              where: { samlConnectionId: { equals: providerId } },
              limit: 50,
              depth: 0,
              req,
              overrideAccess: true,
            });
            for (const org of orgs.docs) {
              await req.payload.update({
                collection: "organizations",
                id: org.id,
                data: { samlConnectionId: null },
                req,
                overrideAccess: true,
              });
            }
          }
        }
        await req.payload.delete({
          collection: "sso-providers",
          where: { user: { equals: id } },
          req,
          overrideAccess: true,
        });
      },
    ],
  },
  fields: [
    { name: "name", type: "text", required: true, index: true },
    { name: "email", type: "text", required: true, unique: true, index: true },
    { name: "emailVerified", type: "checkbox", required: true },
    { name: "image", type: "text" },
    { name: "role", type: "text" },
    { name: "banned", type: "checkbox", defaultValue: false },
    { name: "banReason", type: "text" },
    { name: "banExpires", type: "date" },
    { name: "twoFactorEnabled", type: "checkbox", defaultValue: false },
  ],
};
