import { and, eq, ne, sql } from "@payloadcms/db-postgres/drizzle";
import { sso } from "@better-auth/sso";
import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, magicLink, organization, twoFactor } from "better-auth/plugins";
import { count, isNull } from "drizzle-orm";

import { db } from "@/lib/db";
import { sendTransactionalEmail } from "@/lib/email";
import InviteMemberEmail from "@/lib/email/templates/invite-member";
import MagicLinkEmail from "@/lib/email/templates/magic-link";
import ResetPasswordEmail from "@/lib/email/templates/reset-password";
import VerifyEmail from "@/lib/email/templates/verify-email";
import * as schema from "@/payload-generated-schema";
import {
  emitSsoLoginAuditAndAnalytics,
  ensureOrgMembershipForSsoProvider,
  extractSamlProviderIdFromAuthPath,
} from "@/lib/sso/post-login";

const baseURL = (
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000"
)
  .split("#")[0]
  .trim();

async function cancelOtherPendingInvitations(params: {
  organizationId: string;
  emailLower: string;
  exceptInvitationId?: string;
}) {
  const { organizationId, emailLower, exceptInvitationId } = params;
  const now = new Date().toISOString();
  const base = and(
    eq(schema.invitations.organization, organizationId),
    eq(schema.invitations.status, "pending"),
    sql`lower(${schema.invitations.email}) = ${emailLower}`,
  );
  const whereClause =
    exceptInvitationId !== undefined
      ? and(base, ne(schema.invitations.id, exceptInvitationId))
      : base;
  await db
    .update(schema.invitations)
    .set({ status: "canceled", updatedAt: now })
    .where(whereClause);
}

const googleConfigured =
  Boolean(process.env.GOOGLE_CLIENT_ID) &&
  Boolean(process.env.GOOGLE_CLIENT_SECRET);

export const auth = betterAuth({
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [
    baseURL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
  ].filter((url, i, arr) => arr.indexOf(url) === i),
  ...(googleConfigured
    ? {
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          prompt: "select_account" as const,
        },
      },
    }
    : {}),
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
      ssoProvider: schema.sso_providers,
      user: schema.users,
      session: schema.user_sessions,
      account: schema.user_accounts,
      verification: schema.user_verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
      twoFactor: schema.two_factors,
    },
    usePlural: false,
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: "Reset your password",
        react: ResetPasswordEmail({
          name: user.name?.trim() || user.email,
          resetUrl: url,
        }),
        text: `Reset link: ${url}`,
      });
    },
    onPasswordReset: async ({ user }) => {
      const now = new Date().toISOString();
      await db
        .update(schema.users)
        .set({ emailVerified: true, updatedAt: now })
        .where(eq(schema.users.id, user.id));
    },
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      await sendTransactionalEmail({
        to: user.email,
        subject: "Verify your email",
        react: VerifyEmail({ verifyUrl: url }),
        text: `Verify: ${url}`,
      });
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
  },
  advanced: {
    database: {
      generateId: false,
    },
  },
  user: {
    modelName: "users",
    deleteUser: { enabled: true },
  },
  account: {
    modelName: "user_accounts",
    accountLinking: { allowDifferentEmails: true, enabled: true },
  },
  verification: { modelName: "user_verifications" },
  session: {
    modelName: "user_sessions",
    cookieCache: { enabled: true, maxAge: 5 * 60 },
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      const pathStr = typeof ctx.path === "string" ? ctx.path : "";
      const now = new Date().toISOString();

      const samlPid = extractSamlProviderIdFromAuthPath(pathStr);
      if (samlPid && ctx.context.newSession?.user?.id) {
        await emitSsoLoginAuditAndAnalytics({
          userId: ctx.context.newSession.user.id,
          userEmail: ctx.context.newSession.user.email,
          providerId: samlPid,
        });
      }

      // On sign-up: if this is the very first user, auto-verify + promote to admin
      // so they can sign in immediately without waiting for an email.
      if (pathStr.includes("sign-up")) {
        const email = (ctx.body as { email?: string } | undefined)?.email;
        if (!email) return;
        const [row] = await db.select({ total: count() }).from(schema.users);
        if (Number(row?.total ?? 0) === 1) {
          await db
            .update(schema.users)
            .set({ role: "admin", emailVerified: true, updatedAt: now })
            .where(eq(schema.users.email, email.toLowerCase().trim()));
        }
        return;
      }

      // On sign-in / verify / magic-link / OAuth callback: promote the first user
      // to admin in case they signed up via a flow that didn't hit the hook above.
      const interesting =
        pathStr.includes("sign-in") ||
        pathStr.includes("verify") ||
        pathStr.includes("callback") ||
        pathStr.includes("magic");
      if (!interesting) return;
      const userId = ctx.context.newSession?.user?.id as string | undefined;
      if (!userId) return;
      const [row] = await db.select({ total: count() }).from(schema.users);
      if (Number(row?.total ?? 0) === 1) {
        await db
          .update(schema.users)
          .set({ role: "admin", updatedAt: now })
          .where(and(eq(schema.users.id, userId), isNull(schema.users.role)));
      }
    }),
  },
  plugins: [
    admin({
      adminRoles: ["admin"],
      allowImpersonatingAdmins: true,
    }),
    twoFactor(),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await sendTransactionalEmail({
          to: email,
          subject: "Your sign-in link",
          react: MagicLinkEmail({ signInUrl: url }),
          text: `Sign in: ${url}`,
        });
      },
    }),
    organization({
      organizationHooks: {
        beforeCreateInvitation: async ({
          invitation,
          inviter,
          organization: orgRow,
        }) => {
          const inviterId = (inviter as { id?: string })?.id;
          const orgId = (orgRow as { id?: string })?.id;
          if (!inviterId || !orgId) {
            throw new Error("Invalid invitation context");
          }
          const [member] = await db
            .select({ role: schema.members.role })
            .from(schema.members)
            .where(
              and(
                eq(schema.members.user, inviterId),
                eq(schema.members.organization, orgId),
              ),
            )
            .limit(1);
          const role = member?.role;
          if (role !== "owner" && role !== "admin") {
            throw new Error("Only admins and owners can invite members");
          }
          const emailRaw = (invitation as { email?: string })?.email;
          const inviteOrgId =
            (invitation as { organizationId?: string })?.organizationId ??
            orgId;
          if (typeof emailRaw === "string" && emailRaw.trim()) {
            await cancelOtherPendingInvitations({
              organizationId: inviteOrgId,
              emailLower: emailRaw.trim().toLowerCase(),
            });
          }
        },
      },
      async sendInvitationEmail(data) {
        const org = data.organization as { id?: string };
        if (org?.id && data.email) {
          await cancelOtherPendingInvitations({
            organizationId: org.id,
            emailLower: data.email.trim().toLowerCase(),
            exceptInvitationId: data.id,
          });
        }
        const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
        const inviteLink = `${appUrl}/invite/${data.id}`;
        const inviterName =
          data.inviter?.user?.name?.trim() ||
          data.inviter?.user?.email?.trim() ||
          "A teammate";
        const expiresAt = (data.invitation as { expiresAt?: Date | string })?.expiresAt;
        const expiresInHours = expiresAt
          ? Math.max(
              1,
              Math.round(
                (new Date(expiresAt).getTime() - Date.now()) / 3_600_000,
              ),
            )
          : 72;
        await sendTransactionalEmail({
          to: data.email,
          subject: `Invitation to ${data.organization.name}`,
          react: InviteMemberEmail({
            inviterName,
            orgName: data.organization.name,
            inviteUrl: inviteLink,
            expiresInHours,
          }),
          text: `Join ${data.organization.name}: ${inviteLink}`,
        });
      },
      schema: {
        session: {
          fields: {
            activeOrganizationId: "activeOrganization",
            logoId: "logo",
          },
        },
        member: {
          modelName: "members",
          fields: {
            userId: "user",
            organizationId: "organization",
          },
        },
        invitation: {
          modelName: "invitations",
          fields: {
            organizationId: "organization",
            inviterId: "inviter",
          },
        },
      },
    }),
    sso({
      providersLimit: 500,
      fields: {
        userId: "user",
        organizationId: "organization",
      },
      provisionUser: async ({ user, provider }) => {
        const orgId = provider.organizationId;
        if (typeof orgId === "string" && orgId.length > 0) {
          await ensureOrgMembershipForSsoProvider({
            organizationId: orgId,
            userId: user.id,
          });
        }
      },
    }),
  ],
});
