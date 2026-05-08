# PRD: Next.js Multi-Tenant SaaS Starter

**Version:** 4.0  
**Status:** Ready for Development  
**Target Agent:** AI Coding Agent (Cursor, Claude Code, etc.)

---

## 1. Overview

Build a production-ready Next.js starter repository with a full multi-tenant (organization) architecture. This starter should be immediately usable as a foundation for any SaaS product. It is opinionated, fully typed, and ships with working auth, organization management, email, file uploads, public marketing pages, audit logs, webhooks, feature flags, usage quotas, Stripe billing, analytics/event tracking, SSO/SAML enterprise auth, granular per-resource permissions, testing, and Docker support out of the box.

---

## 2. Tech Stack

### Core

| Layer | Package | Reason |
|---|---|---|
| Framework | Next.js (latest, App Router) | — |
| UI Components | shadcn/ui + Tailwind CSS v4 | — |
| Icons | lucide-react | — |
| Backend / CMS | Payload CMS (latest) | DB schema, migrations, media, admin panel |
| Authentication | better-auth (with Organizations plugin) | Multi-tenant auth out of the box |
| Database | PostgreSQL 16 | Primary data store |
| ORM / Migrations | Drizzle ORM + Payload CLI (`payload migrate`) | Payload uses Drizzle internally; shared instance |
| File Uploads | AWS S3 (via Payload CMS S3 adapter) | — |
| Forms | React Hook Form | — |
| Validation | Zod | — |
| Client Caching | TanStack Query (React Query) | — |
| Email | Nodemailer + React Email | — |
| Testing | Playwright | E2E |
| Containerization | Docker + Docker Compose | — |

### New Systems (v2.0)

| Layer | Package | Reason |
|---|---|---|
| Marketing Pages | Custom-built with shadcn/ui + `next-mdx-remote` | No external dependency; MDX for blog/changelog |
| Animations | `framer-motion` | Scroll animations on marketing pages |
| Audit Logs | Custom Payload CMS collection + `zod` event typing | Self-contained, no third-party SaaS required |
| Webhooks | **Svix** (self-hosted open-source, MIT license) | Battle-tested, retry logic, embeddable UI, Node.js SDK |
| Feature Flags | **`flags` SDK** (Vercel Flags SDK, open-source) + custom Postgres adapter | Provider-agnostic, Next.js native, works without Vercel |
| Usage Quotas | **`@upstash/ratelimit`** + Redis (via `ioredis` for self-hosted) | Sliding window, per-org token-bucket quotas |
| Rate Limiting | **`@upstash/ratelimit`** (same package as quotas) | Shared Redis, one library for two concerns |

### New Systems (v4.0)

| Layer | Package | Reason |
|---|---|---|
| Billing | **Stripe** (`stripe` Node SDK + `@stripe/stripe-js`) | Industry-standard, Stripe Billing handles subscriptions, invoicing, and Customer Portal |
| Analytics | **PostHog** (`posthog-js` + `posthog-node`) | Open-source, self-hostable, product analytics + session replay + feature flags |
| SSO / SAML | **better-auth SAML plugin** + `@boxyhq/saml-jackson` (self-hosted) | Plugs into existing better-auth setup; BoxyHQ handles SAML SP/IdP metadata |
| Granular Permissions | **Permit.io SDK** (`permitio`) + custom Payload-backed policy store | Fine-grained RBAC/ABAC; swappable for any OPA-compatible backend |

### Package Selection Rationale

**Audit Logs — Custom (Payload CMS Collection)**  
Mature Node audit libraries are either unmaintained or MongoDB-only. The cleanest approach for a Payload-based stack is a dedicated `AuditLogs` collection with a typed Zod event schema. You own the data in Postgres, query/filter it via Payload Admin for free, and the implementation is ~100 lines. Zero external services.

**Webhooks — Svix (MIT, self-hosted)**  
After evaluating Svix vs Hook0 vs Convoy (2025): Convoy is now unmaintained; Hook0 is SSPL-licensed (not true open source). Svix is MIT-licensed, self-hostable via a single Docker image, has a production-grade Node.js SDK (`svix`), handles retries/signatures/replay, and ships an embeddable customer portal UI. Use Svix self-hosted in docker-compose; optionally swap to Svix Cloud later with zero code changes.

**Feature Flags — Vercel Flags SDK (`flags`)**  
Free, open-source, framework-native for Next.js App Router, fully TypeScript, and provider-agnostic. Does NOT require Vercel. Back it with a Postgres table via a custom `decide()` function so no external service is needed at all. Significantly simpler than self-hosting Unleash or Flagsmith for a starter repo.

**Usage Quotas — `@upstash/ratelimit` + self-hosted Redis**  
The best-maintained TypeScript-first rate/quota library for Next.js. Supports sliding window, fixed window, and token bucket algorithms. Works with any Redis-compatible server — use the self-hosted Redis in docker-compose so no Upstash account is required (Upstash is opt-in for production managed Redis).

**Billing — Stripe**  
The de-facto standard for SaaS billing. Stripe Billing handles subscription lifecycle, proration, trial periods, invoice PDF generation, and the Customer Portal (self-service plan changes, cancellation, invoice download) with zero custom UI needed. The `stripe` Node SDK is the only runtime dependency; `@stripe/stripe-js` loads the Stripe.js script on payment pages only.

**Analytics — PostHog**  
PostHog is MIT-licensed, self-hostable via Docker, and provides product analytics, session replay, funnels, cohorts, and A/B testing in one SDK. `posthog-js` runs client-side for pageview and event tracking; `posthog-node` fires server-side events from Server Actions. Using PostHog avoids shipping a separate analytics service alongside the already-dense docker-compose stack — one service, one privacy-first vendor.

**SSO / SAML — better-auth SAML plugin + BoxyHQ Jackson**  
better-auth already owns the auth layer in this stack. Its SAML plugin delegates to a sidecar `@boxyhq/saml-jackson` service (MIT-licensed, self-hostable as a Docker container). Jackson handles SAML SP/IdP metadata exchange, assertion parsing, and callback routing. The application only sees a normalized OAuth-like redirect flow — no raw SAML XML in app code. BoxyHQ Jackson can be swapped for Okta, Azure AD SAML, or any SAML 2.0 IdP with no code changes beyond environment variables.

**Granular Permissions — custom Payload-backed policy store**  
The three-role model (`owner` / `admin` / `member`) is sufficient for most SaaS products but not for enterprise customers who need resource-level access control (e.g. "user X can read but not edit Project Y"). Rather than introducing a heavy policy engine, v4.0 adds a lightweight custom permissions layer backed by a Payload `Permissions` collection. Each permission record encodes `{ subjectId, subjectType, resourceType, resourceId, actions[] }`. A `checkPermission()` helper resolves this at runtime. This is intentionally simple — not a full ABAC engine — but it provides the data model and API surface that an enterprise customer needs without the operational complexity of running Permit.io, OPA, or Casbin in the starter.

---

## 3. Repository Structure

```
/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── (marketing)/                # Public route group — no auth required
│   │   │   ├── layout.tsx              # Marketing layout: nav + footer
│   │   │   ├── page.tsx                # Homepage / Hero
│   │   │   ├── pricing/
│   │   │   │   └── page.tsx
│   │   │   ├── features/
│   │   │   │   └── page.tsx
│   │   │   ├── blog/
│   │   │   │   ├── page.tsx            # Blog index
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx        # Blog post (MDX)
│   │   │   ├── changelog/
│   │   │   │   └── page.tsx
│   │   │   └── legal/
│   │   │       ├── privacy/page.tsx
│   │   │       └── terms/page.tsx
│   │   ├── (auth)/                     # Auth route group
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   ├── forgot-password/page.tsx
│   │   │   └── reset-password/page.tsx
│   │   ├── (dashboard)/                # Protected route group
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── account/
│   │   │   │   ├── page.tsx
│   │   │   │   └── security/page.tsx
│   │   │   ├── organizations/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/page.tsx
│   │   │   │   └── [orgSlug]/
│   │   │   │       ├── page.tsx
│   │   │   │       ├── settings/page.tsx
│   │   │   │       ├── members/page.tsx
│   │   │   │       ├── audit-logs/page.tsx
│   │   │   │       ├── webhooks/
│   │   │   │       │   ├── page.tsx
│   │   │   │       │   └── [endpointId]/page.tsx
│   │   │   │       ├── usage/page.tsx
│   │   │   │       └── permissions/page.tsx
│   │   │   └── settings/page.tsx
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts
│   │   │   ├── invitations/accept/route.ts   # Invitation acceptance handler
│   │   │   ├── orgs/[orgId]/usage/route.ts  # Quota counter endpoint
│   │   │   ├── webhooks/
│   │   │   │   ├── svix/route.ts            # Svix operational webhook handler
│   │   │   │   └── stripe/route.ts          # Stripe webhook handler
│   │   │   ├── billing/
│   │   │   │   └── portal/route.ts          # Customer Portal redirect
│   │   │   └── [...payload]/route.ts
│   │   ├── layout.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── ui/                         # shadcn/ui auto-generated
│   │   ├── marketing/
│   │   │   ├── nav.tsx
│   │   │   ├── footer.tsx
│   │   │   ├── hero.tsx
│   │   │   ├── features-section.tsx
│   │   │   ├── pricing-section.tsx
│   │   │   ├── testimonials-section.tsx
│   │   │   ├── faq-section.tsx
│   │   │   ├── cta-section.tsx
│   │   │   └── blog-card.tsx
│   │   ├── auth/
│   │   │   ├── login-form.tsx
│   │   │   ├── register-form.tsx
│   │   │   ├── forgot-password-form.tsx
│   │   │   └── reset-password-form.tsx
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   ├── org-switcher.tsx
│   │   │   └── user-nav.tsx
│   │   ├── organizations/
│   │   │   ├── org-card.tsx
│   │   │   ├── create-org-form.tsx
│   │   │   ├── org-settings-form.tsx
│   │   │   ├── members-table.tsx
│   │   │   └── invite-member-dialog.tsx
│   │   ├── account/
│   │   │   ├── profile-form.tsx
│   │   │   └── security-form.tsx
│   │   ├── audit-logs/
│   │   │   ├── audit-log-table.tsx
│   │   │   └── audit-log-filters.tsx
│   │   ├── webhooks/
│   │   │   ├── endpoint-list.tsx
│   │   │   ├── add-endpoint-dialog.tsx
│   │   │   └── delivery-log-table.tsx
│   │   └── usage/
│   │       ├── quota-card.tsx
│   │       └── usage-chart.tsx
│   │   ├── billing/
│   │   │   ├── plan-card.tsx
│   │   │   ├── upgrade-dialog.tsx
│   │   │   └── billing-portal-button.tsx
│   │   └── permissions/
│   │       ├── permissions-table.tsx
│   │       └── grant-permission-dialog.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   ├── auth.ts
│   │   │   ├── auth-client.ts
│   │   │   ├── payload-access.ts       # getSessionForAccess() helper
│   │   │   └── middleware.ts
│   │   ├── db/
│   │   │   └── index.ts                # Shared Drizzle instance (from Payload)
│   │   ├── payload/
│   │   │   └── payload.ts
│   │   ├── actions/
│   │   │   ├── organization.ts         # createOrg, updateOrg, deleteOrg
│   │   │   ├── member.ts               # inviteMember, removeMember, changeRole
│   │   │   └── account.ts              # updateProfile, changePassword
│   │   ├── query/
│   │   │   └── client.tsx
│   │   ├── email/
│   │   │   ├── send.ts
│   │   │   └── templates/
│   │   │       ├── invite-member.tsx
│   │   │       ├── reset-password.tsx
│   │   │       ├── welcome.tsx
│   │   │       └── quota-warning.tsx
│   │   ├── s3/
│   │   │   └── client.ts
│   │   ├── audit/
│   │   │   ├── log.ts                  # createAuditLog() helper
│   │   │   └── events.ts               # Zod-typed event catalog
│   │   ├── webhooks/
│   │   │   ├── svix.ts                 # Svix client singleton
│   │   │   └── events.ts               # Typed webhook event catalog
│   │   ├── flags/
│   │   │   ├── flags.ts                # Flag definitions
│   │   │   └── adapter.ts              # Custom Postgres adapter
│   │   ├── quota/
│   │   │   ├── limiter.ts              # @upstash/ratelimit wrappers
│   │   │   ├── plans.ts                # Plan definitions
│   │   │   └── check.ts                # checkQuota() helper
│   │   ├── billing/
│   │   │   ├── stripe.ts               # Stripe client singleton
│   │   │   ├── plans.ts                # Stripe Price ID map
│   │   │   ├── webhooks.ts             # Stripe webhook handler helpers
│   │   │   └── portal.ts               # Customer Portal session helper
│   │   ├── analytics/
│   │   │   ├── server.ts               # posthog-node server client
│   │   │   └── client.tsx              # PostHogProvider + client helpers
│   │   ├── permissions/
│   │   │   ├── check.ts                # checkPermission() helper
│   │   │   └── types.ts                # Permission type definitions
│   │   ├── mdx/
│   │   │   ├── loader.ts               # MDX file loader
│   │   │   └── components.tsx          # MDX component overrides
│   │   ├── validations/
│   │   │   ├── auth.ts
│   │   │   ├── organization.ts
│   │   │   └── account.ts
│   │   └── utils.ts
│   ├── hooks/
│   │   ├── use-session.ts
│   │   ├── use-active-org.ts
│   │   ├── use-organizations.ts
│   │   ├── use-members.ts
│   │   ├── use-audit-logs.ts
│   │   ├── use-quota.ts
│   │   ├── use-billing.ts
│   │   └── use-permissions.ts
│   ├── payload/
│   │   ├── payload.config.ts
│   │   ├── collections/
│   │   │   ├── Users.ts
│   │   │   ├── Media.ts
│   │   │   ├── Organizations.ts
│   │   │   ├── AuditLogs.ts
│   │   │   ├── FeatureFlags.ts
│   │   │   └── Permissions.ts
│   │   └── migrations/
│   └── middleware.ts
├── content/
│   ├── blog/
│   │   └── getting-started.mdx
│   └── changelog/
│       └── v1-0-0.mdx
├── emails/
│   └── previews/
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts
│   │   ├── organizations.spec.ts
│   │   ├── members.spec.ts
│   │   ├── marketing.spec.ts
│   │   ├── audit-logs.spec.ts
│   │   ├── webhooks.spec.ts
│   │   └── quota.spec.ts
│   └── fixtures/
│       └── test-user.ts
├── docker/
│   ├── Dockerfile
│   └── Dockerfile.dev
├── docker-compose.yml
├── docker-compose.dev.yml
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── components.json
├── playwright.config.ts
└── payload-types.ts
```

---

## 4. Authentication — better-auth

### 4.1 Configuration (`src/lib/auth/auth.ts`)

```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "better-auth/adapters/drizzle"
import { organization, twoFactor, magicLink, emailAndPassword } from "better-auth/plugins"
import { db } from "@/lib/db"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  plugins: [
    emailAndPassword(),
    organization({
      allowUserToCreateOrganization: true,
      organizationLimit: 5,
      membershipLimit: 100,
    }),
    twoFactor(),
    magicLink({ sendMagicLink: async ({ email, url }) => { /* nodemailer */ } }),
  ],
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => { /* nodemailer */ },
  },
  session: { cookieCache: { enabled: true, maxAge: 60 * 5 } },
})
```

### 4.2 Client (`src/lib/auth/auth-client.ts`)

```ts
import { createAuthClient } from "better-auth/react"
import { organizationClient, twoFactorClient } from "better-auth/client/plugins"

export const authClient = createAuthClient({
  plugins: [organizationClient(), twoFactorClient()],
})
export const { signIn, signUp, signOut, useSession, organization } = authClient
```

### 4.3 API Route (`src/app/api/auth/[...all]/route.ts`)

```ts
import { auth } from "@/lib/auth/auth"
import { toNextJsHandler } from "better-auth/next-js"
export const { GET, POST } = toNextJsHandler(auth)
```

### 4.4 Middleware (`src/middleware.ts`)

Execution order within middleware:

1. **Rate limiting** — apply IP-based sliding window to all `/api/*` routes (see Section 10.5). Return `429` immediately if exceeded.
2. **Auth check** — call `auth.api.getSession({ headers: request.headers })`. If no session and path is under `/(dashboard)`, redirect to `/login` with `?callbackUrl=<current path>`.
3. **Active org resolution** — if session exists and `session.session.activeOrganizationId` is null, call `auth.api.setActiveOrganization` using the user's first org. This keeps the active org in better-auth's session, not a custom cookie.
4. **Org membership guard** — for `/(dashboard)/organizations/[orgSlug]/*` routes, resolve the org by slug from the Payload Organizations collection and verify `session.session.activeOrganizationId` matches. If not a member, redirect to `/dashboard`.
5. **Public pass-through** — `/(marketing)` and `/(auth)` routes always pass through.

```ts
// src/middleware.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { apiRateLimiter } from "@/lib/quota/limiter"

export async function middleware(request: NextRequest) {
  // 1. Rate limiting
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for") ?? "unknown"
    const { success } = await apiRateLimiter.limit(ip)
    if (!success) return new NextResponse("Too many requests", { status: 429 })
  }

  // 2. Auth check
  const session = await auth.api.getSession({ headers: request.headers })
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard") ||
    request.nextUrl.pathname.startsWith("/organizations") ||
    request.nextUrl.pathname.startsWith("/account") ||
    request.nextUrl.pathname.startsWith("/settings")

  if (isDashboard && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
```

### 4.5 Payload Access Helper (`src/lib/auth/payload-access.ts`)

Since Payload's built-in auth is disabled on the Users collection, all Payload `access` control functions must validate sessions through better-auth. Use this shared helper:

```ts
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"

export async function getSessionForAccess() {
  return auth.api.getSession({ headers: await headers() })
}

// Usage inside any Payload collection access function:
// access: {
//   read: async () => {
//     const session = await getSessionForAccess()
//     return !!session
//   }
// }
```

For role-gated collections (e.g. AuditLogs — `owner` and `admin` only):

```ts
access: {
  read: async ({ req }) => {
    const session = await getSessionForAccess()
    if (!session) return false
    const orgId = session.session.activeOrganizationId
    if (!orgId) return false
    const member = await auth.api.getActiveMember({ headers: await headers() })
    return member?.role === "owner" || member?.role === "admin"
  },
}
```

### 4.6 Schema Migration — better-auth

better-auth manages its own tables (`user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`) independently of Payload. Run schema generation **before** Payload migrations:

```bash
# 1. Generate better-auth schema (outputs a SQL migration file)
npx better-auth generate

# 2. Apply it (better-auth applies its own migration)
npx better-auth migrate

# 3. Then run Payload migrations for Payload-owned tables
npx payload migrate:create --name init
npx payload migrate
```

Never modify better-auth's generated tables manually. Never add better-auth tables to Payload collections.

---

## 5. Organization Architecture

Each user can belong to multiple organizations. Each org has a unique `slug`. Active org is tracked via `session.session.activeOrganizationId` managed by better-auth — **not** a custom cookie. Roles: `owner`, `admin`, `member`.

### 5.1 Slug Generation

Org slugs are auto-generated from the org name on creation using the `slugify` package:

```ts
import slugify from "slugify"

function generateSlug(name: string): string {
  return slugify(name, { lower: true, strict: true, trim: true })
}
```

Slug uniqueness is enforced by better-auth (unique constraint on the `organization` table). On collision, append a numeric suffix: `my-org`, `my-org-2`, `my-org-3`. Slugs are not user-editable after creation.

### 5.2 Active Org Switching

Switching active org calls `authClient.organization.setActive({ organizationId })`. This updates `session.activeOrganizationId` server-side. After switching, the router refreshes to reload Server Components with the new active org context.

### 5.3 Org Switcher Component

Vercel-style. Popover with search, org list (checkmark on active), "Create Organization" link, separator. Uses `ChevronsUpDown`, `Check`, `Plus`, `Building2` from lucide-react. shadcn `Command` + `Popover` pattern.

---

## 6. Payload CMS + better-auth Integration

### 6.1 Architecture Overview

Payload (with Drizzle) and better-auth share the **same PostgreSQL database** but manage separate table namespaces. They never write to each other's tables directly.

- **better-auth owns:** `user`, `session`, `account`, `verification`, `organization`, `member`, `invitation`
- **Payload owns:** `media`, `audit_logs`, `feature_flags`, `organizations` (mirror), `users` (mirror), and all other content collections

### 6.2 Shared Drizzle Instance (`src/lib/db/index.ts`)

Payload initializes its own Drizzle instance internally. Expose it as a shared singleton so better-auth uses the same connection pool — never create a second `pg` pool:

```ts
import config from "@/payload/payload.config"
import { getPayload } from "payload"

let _db: ReturnType<typeof import("drizzle-orm/node-postgres").drizzle> | null = null

export async function getDb() {
  if (_db) return _db
  const payload = await getPayload({ config })
  _db = payload.db.drizzle
  return _db
}

// Convenience re-export for better-auth adapter (resolves at module init in server context)
import { getDb } from "./index"
export const db = await getDb()
```

> **Note for agent:** `db` must only be imported in server-side code (Server Components, Server Actions, route handlers). Never import into Client Components.

### 6.3 Payload Users Collection — Auth Disabled

The Payload `Users` collection is a **read-only mirror** for admin panel display. Payload's built-in auth is disabled to prevent conflicts with better-auth:

```ts
// src/payload/collections/Users.ts
import type { CollectionConfig } from "payload"

export const Users: CollectionConfig = {
  slug: "users",
  admin: { useAsTitle: "email" },
  auth: false,                          // ← CRITICAL: disables Payload's own auth
  fields: [
    { name: "email",           type: "text", required: true },
    { name: "name",            type: "text" },
    { name: "betterAuthUserId", type: "text", unique: true, index: true },
    { name: "avatar",          type: "upload", relationTo: "media" },
  ],
  access: {
    read:   async () => { const s = await getSessionForAccess(); return !!s },
    create: () => false,   // only created via better-auth sync
    update: () => false,
    delete: () => false,
  },
}
```

### 6.4 Payload Admin Panel Access

Access to `/admin` is restricted to users whose `betterAuthUserId` is present in the Payload Users collection **and** whose better-auth session is valid. Add a global Payload `access` function in `payload.config.ts`:

```ts
// src/payload/payload.config.ts
export default buildConfig({
  // ...
  admin: {
    user: "users",
    // Custom auth check — Payload calls this to decide if /admin is accessible
    async access({ req }) {
      const session = await getSessionForAccess()
      return !!session   // any authenticated user can access admin in this starter
      // To restrict to specific users: return session?.user.email === process.env.ADMIN_EMAIL
    },
  },
})
```

Admins manage Feature Flags and view AuditLogs via the Payload Admin panel. No custom admin UI is built for these.

### 6.5 Org Creation — Dual-Write Pattern

Creating an org requires writes to three systems in sequence. Implement in the `createOrg` Server Action (`src/lib/actions/organization.ts`):

```
Step 1 — better-auth (source of truth for auth/membership):
  await authClient.organization.create({ name, slug })
  → returns { id: betterAuthOrgId, slug, name }

Step 2 — Payload (mirror record for CMS, media, plan, svixAppId):
  await payload.create({
    collection: "organizations",
    data: { name, slug, betterAuthOrgId, plan: "free", svixAppId: "" }
  })
  → returns Payload org document

Step 3 — Svix (webhook application per org):
  await svix.application.create({ name, uid: betterAuthOrgId })
  → returns { id: svixAppId }

Step 4 — Update Payload record with svixAppId:
  await payload.update({
    collection: "organizations",
    where: { betterAuthOrgId: { equals: betterAuthOrgId } },
    data: { svixAppId }
  })
```

**Failure handling:** Steps are not wrapped in a distributed transaction. On failure at Step 2 or later, log the error with full context (`betterAuthOrgId`, failed step, error message) and return a user-facing error: `"Organization created but setup incomplete. Please contact support."` Do not silently swallow. Do not retry automatically.

### 6.6 Org Deletion — Cleanup Pattern

```
Step 1 — Svix: svix.application.delete(svixAppId)
Step 2 — Payload: delete Organizations record by betterAuthOrgId
Step 3 — better-auth: authClient.organization.delete({ organizationId: betterAuthOrgId })
```

Reverse order from creation. Step 3 cascades deletion of `member` and `invitation` rows in better-auth tables.

### 6.7 Looking Up the Payload Org from a Request

In Server Actions and route handlers, resolve the Payload org record from the active better-auth session:

```ts
import { auth } from "@/lib/auth/auth"
import { headers } from "next/headers"
import { getPayload } from "payload"
import config from "@/payload/payload.config"

export async function getActivePayloadOrg() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.session.activeOrganizationId) return null

  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: "organizations",
    where: { betterAuthOrgId: { equals: session.session.activeOrganizationId } },
    limit: 1,
  })
  return result.docs[0] ?? null
}
```

---

## 7. RBAC — Role Permission Matrix

Roles are defined by better-auth's Organizations plugin: `owner`, `admin`, `member`. The table below is the authoritative permission definition. All access control functions and UI guards must follow it exactly.

| Feature | Owner | Admin | Member |
|---|---|---|---|
| View dashboard | ✅ | ✅ | ✅ |
| View org overview | ✅ | ✅ | ✅ |
| Edit org settings (name, logo) | ✅ | ✅ | ❌ |
| Delete org | ✅ | ❌ | ❌ |
| View members list | ✅ | ✅ | ✅ |
| Invite member | ✅ | ✅ | ❌ |
| Remove member | ✅ | ✅ | ❌ |
| Change member role | ✅ | ❌ | ❌ |
| View audit logs | ✅ | ✅ | ❌ |
| Export audit logs (CSV) | ✅ | ✅ | ❌ |
| View webhooks | ✅ | ✅ | ❌ |
| Add/delete webhook endpoints | ✅ | ✅ | ❌ |
| Replay failed webhook | ✅ | ✅ | ❌ |
| View usage dashboard | ✅ | ✅ | ✅ |
| Manage feature flags (Payload Admin) | ✅ | ❌ | ❌ |
| View Payload Admin panel | ✅ | ❌ | ❌ |
| View billing / subscription | ✅ | ✅ | ❌ |
| Upgrade / change plan | ✅ | ❌ | ❌ |
| Open Customer Portal | ✅ | ✅ | ❌ |
| View granular permissions | ✅ | ✅ | ❌ |
| Grant / revoke granular permissions | ✅ | ❌ | ❌ |
| SSO / SAML configuration | ✅ | ❌ | ❌ |

**Enforcement pattern:** Role is checked in two places — server-side (Server Action or route handler returns `403`) and client-side (UI element hidden or replaced with a disabled state). Never rely on UI alone.

```ts
// Reusable role check helper (src/lib/auth/payload-access.ts)
export async function requireOrgRole(
  minimumRole: "member" | "admin" | "owner"
): Promise<{ session: Session; member: Member } | never> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) throw new Error("UNAUTHORIZED")

  const member = await auth.api.getActiveMember({ headers: await headers() })
  if (!member) throw new Error("NOT_A_MEMBER")

  const roleRank = { member: 0, admin: 1, owner: 2 }
  if (roleRank[member.role] < roleRank[minimumRole]) throw new Error("FORBIDDEN")

  return { session, member }
}
```

---

## 8. Server Actions Catalog

All mutations are implemented as Next.js Server Actions in `src/lib/actions/`. Every action follows this contract: validate input with Zod, check role with `requireOrgRole()`, perform the operation, call `createAuditLog()`, call `sendWebhook()` where applicable, and return `{ success: true, data }` or throw a typed error.

### 8.1 `src/lib/actions/organization.ts`

| Action | Input | Min Role | Side Effects |
|---|---|---|---|
| `createOrg(data)` | `{ name: string }` | any authed user | better-auth + Payload + Svix dual-write (§6.5) |
| `updateOrg(data)` | `{ orgId, name?, logoId? }` | admin | Payload update; audit `org.updated`; webhook `org.updated` |
| `deleteOrg(data)` | `{ orgId, confirmName: string }` | owner | Cleanup sequence (§6.6); audit `org.deleted` |

### 8.2 `src/lib/actions/member.ts`

| Action | Input | Min Role | Side Effects |
|---|---|---|---|
| `inviteMember(data)` | `{ email, role }` | admin | `auth.api.createInvitation()`; send `invite-member` email; audit `member.invited` |
| `removeMember(data)` | `{ memberId }` | admin | `auth.api.removeMember()`; audit `member.removed`; webhook `member.removed` |
| `changeMemberRole(data)` | `{ memberId, newRole }` | owner | `auth.api.updateMemberRole()`; audit `member.role_changed`; webhook `member.role_changed` |
| `cancelInvitation(data)` | `{ invitationId }` | admin | `auth.api.cancelInvitation()` |

### 8.3 `src/lib/actions/account.ts`

| Action | Input | Min Role | Side Effects |
|---|---|---|---|
| `updateProfile(data)` | `{ name?, avatarId? }` | any authed user | Update better-auth user + Payload Users mirror |
| `changePassword(data)` | `{ currentPassword, newPassword }` | any authed user | `auth.api.changePassword()`; audit `auth.password_changed` |
| `enable2FA(data)` | `{ totpCode }` | any authed user | `auth.api.verifyTOTP()`; audit `auth.2fa_enabled` |

### 8.4 `src/lib/actions/billing.ts`

| Action | Input | Min Role | Side Effects |
|---|---|---|---|
| `createCheckoutSession(data)` | `{ orgId, priceId, successUrl, cancelUrl }` | owner | `stripe.checkout.sessions.create()`; audit `billing.checkout_started` |
| `createPortalSession(data)` | `{ orgId }` | owner or admin | `stripe.billingPortal.sessions.create()`; returns portal URL |
| `cancelSubscription(data)` | `{ orgId }` | owner | `stripe.subscriptions.update({ cancel_at_period_end: true })`; audit `billing.subscription_cancelled` |

### 8.5 `src/lib/actions/permissions.ts`

| Action | Input | Min Role | Side Effects |
|---|---|---|---|
| `grantPermission(data)` | `{ orgId, subjectId, subjectType, resourceType, resourceId, actions }` | owner | Payload create in Permissions collection; audit `permission.granted` |
| `revokePermission(data)` | `{ permissionId }` | owner | Payload delete; audit `permission.revoked` |
| `listPermissions(data)` | `{ orgId, resourceType?, resourceId? }` | owner or admin | Payload find; no side effects |

---

## 9. Member Invitation Flow

### 9.1 Sending an Invitation

1. User fills `invite-member-dialog.tsx` with email and role.
2. `inviteMember()` Server Action calls `auth.api.createInvitation({ email, role, organizationId })`.
3. better-auth creates a record in the `invitation` table with a unique token and 48-hour expiry.
4. The action sends the `invite-member.tsx` email with URL: `${NEXT_PUBLIC_APP_URL}/api/invitations/accept?token=<token>`.
5. Audit log entry `member.invited` is created.

### 9.2 Accepting an Invitation (`src/app/api/invitations/accept/route.ts`)

```
GET /api/invitations/accept?token=<token>

1. Call auth.api.acceptInvitation({ invitationToken: token })
   → If user is not logged in, better-auth returns an error.
   → Redirect to /login?callbackUrl=/api/invitations/accept?token=<token>
     so the flow resumes after login.

2. On success:
   → better-auth creates the member record.
   → Redirect to /dashboard with toast param: ?welcome=1

3. On expired/invalid token:
   → Redirect to /login?error=invitation_expired
```

### 9.3 Invitation for New Users

If the invited email has no account, the invite email includes copy: "Create your account first, then click the link again." The acceptance route handles this gracefully — if the user creates an account and then revisits the token URL, the flow proceeds normally as long as the token has not expired (48 hours).

### 9.4 Pending Invitations UI

`members-table.tsx` displays a "Pending" tab alongside active members, listing outstanding invitations with email, role, expiry, and a "Cancel" button (calls `cancelInvitation()`). Data fetched via `auth.api.listInvitations({ organizationId })`.

---

## 10. Error Handling & Loading State Conventions

### 10.1 Server Action Errors

Server Actions throw errors using a typed error pattern. The calling component catches them via TanStack Query's `onError`:

```ts
// In a Server Action:
if (!session) throw new Error("UNAUTHORIZED")
if (roleRank[member.role] < roleRank[minimumRole]) throw new Error("FORBIDDEN")
// Field validation failures: throw new Error("VALIDATION: <message>")
// Generic failures: throw new Error("<user-facing message>")
```

```ts
// In a form component (via useMutation):
onError: (err) => {
  if (err.message === "UNAUTHORIZED") router.push("/login")
  else if (err.message === "FORBIDDEN") toast.error("You don't have permission to do this.")
  else if (err.message.startsWith("VALIDATION:")) toast.error(err.message.replace("VALIDATION: ", ""))
  else toast.error(err.message || "Something went wrong.")
}
```

### 10.2 Global Error Boundary

`src/app/error.tsx` — catches unhandled runtime errors in Server Components. Shows a generic "Something went wrong" message with a "Try again" button that calls `reset()`.

`src/app/not-found.tsx` — shown for 404s. Includes a link back to `/dashboard`.

### 10.3 Dashboard 403 Handling

When a user navigates to a route they lack permission for (e.g. `member` visiting `/audit-logs`), the Server Component checks the role and calls `redirect("/dashboard")`. No error page is shown — silent redirect with a toast on the dashboard: append `?error=forbidden` to the redirect URL and read it in the dashboard layout.

### 10.4 Loading States

- Every data-fetching Server Component wraps its content in a `<Suspense>` boundary with a `<Skeleton>` fallback.
- The `Skeleton` shape must match the eventual content layout (e.g. a table skeleton has the same number of rows as the default page size).
- Mutation buttons show a `Loader2` spinner (lucide-react) and are `disabled` while `isPending`.
- Destructive action dialogs disable the confirm button and show a spinner during the mutation.

### 10.5 CSV Export

Audit log CSV export is a streaming API route handler — not a client-side download. The "Export CSV" button in the audit log table triggers:

```
GET /api/orgs/[orgId]/audit-logs/export?from=<date>&to=<date>&action=<type>

Response headers:
  Content-Type: text/csv
  Content-Disposition: attachment; filename="audit-log-<orgId>-<date>.csv"

Implementation:
  - Verify session + admin/owner role.
  - Stream Payload find() results in batches of 100 using a ReadableStream.
  - First row: headers (Actor, Email, Action, Resource, IP Address, Timestamp).
  - Use fast-csv or papaparse (server-side) to format rows.
```

Add `src/app/api/orgs/[orgId]/audit-logs/export/route.ts` to the file structure.

---

## 11. `next.config.ts` Specification

```ts
import type { NextConfig } from "next"
import { withPayload } from "@payloadcms/next"

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // MinIO (dev)
      { protocol: "http",  hostname: "localhost", port: "9000" },
      // AWS S3 (production)
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    ],
  },
  experimental: {
    // Required for better-auth server-side session reads in middleware
    serverComponentsExternalPackages: ["better-auth"],
  },
  transpilePackages: ["@react-email/components"],
}

export default withPayload(nextConfig)
```

---

## 12. MDX Frontmatter Specification

### Blog Posts (`/content/blog/*.mdx`)

```yaml
---
title: "Getting Started with the Starter"   # string, required
date: "2025-01-15"                           # ISO date string YYYY-MM-DD, required
description: "A short summary..."            # string, required — used in og:description
author:                                      # object, required
  name: "Jane Doe"
  avatar: "/avatars/jane.jpg"               # relative to /public, optional
tags: ["nextjs", "saas"]                    # string[], optional
coverImage: "/blog/cover.jpg"               # relative to /public, optional
---
```

### Changelog Entries (`/content/changelog/*.mdx`)

```yaml
---
version: "1.0.0"          # semver string, required
date: "2025-01-01"        # ISO date string YYYY-MM-DD, required
title: "Initial Release"  # string, required
---
```

Dates are displayed formatted as `"January 15, 2025"` using `new Intl.DateTimeFormat("en-US", { dateStyle: "long" })`. Changelog entries are sorted descending by `date` at build time.

---

## 13. Audit Logs

### 13.1 Architecture

Implemented as a **Payload CMS collection** — all data in Postgres, queryable via Payload Admin, zero external services.

### 13.2 `AuditLogs` Collection (`src/payload/collections/AuditLogs.ts`)

Fields:
- `organizationId` — text, indexed
- `actorId` — text (better-auth user ID)
- `actorEmail` — text
- `actorName` — text
- `action` — text, indexed (e.g. `"member.invited"`)
- `resourceType` — text (e.g. `"member"`, `"organization"`, `"webhook"`)
- `resourceId` — text
- `metadata` — json (action-specific payload)
- `ipAddress` — text
- `userAgent` — text
- `createdAt` — date, auto-set

Access: read restricted to `owner` + `admin` roles via `getSessionForAccess()` + `requireOrgRole("admin")`. No user-facing write API.

### 13.3 Typed Event Catalog (`src/lib/audit/events.ts`)

```ts
export const AuditEvents = {
  // Auth
  "auth.login":            z.object({ method: z.enum(["password", "magic_link", "oauth"]) }),
  "auth.logout":           z.object({}),
  "auth.password_changed": z.object({}),
  "auth.2fa_enabled":      z.object({}),
  // Organization
  "org.created":           z.object({ name: z.string() }),
  "org.updated":           z.object({ changes: z.record(z.unknown()) }),
  "org.deleted":           z.object({ name: z.string() }),
  // Members
  "member.invited":        z.object({ email: z.string(), role: z.string() }),
  "member.removed":        z.object({ userId: z.string(), email: z.string() }),
  "member.role_changed":   z.object({ userId: z.string(), from: z.string(), to: z.string() }),
  // Webhooks
  "webhook.endpoint_created": z.object({ url: z.string() }),
  "webhook.endpoint_deleted": z.object({ endpointId: z.string() }),
  // Feature Flags
  "flag.toggled":          z.object({ flag: z.string(), enabled: z.boolean() }),
  // Billing
  "billing.checkout_started":       z.object({ priceId: z.string() }),
  "billing.subscription_activated": z.object({ plan: z.string(), stripeSubscriptionId: z.string() }),
  "billing.subscription_cancelled": z.object({ stripeSubscriptionId: z.string() }),
  "billing.plan_changed":           z.object({ from: z.string(), to: z.string() }),
  // Permissions
  "permission.granted": z.object({ subjectId: z.string(), subjectType: z.string(), resourceType: z.string(), resourceId: z.string(), actions: z.array(z.string()) }),
  "permission.revoked": z.object({ permissionId: z.string() }),
  // SSO
  "sso.connection_created": z.object({ idpName: z.string() }),
  "sso.connection_deleted": z.object({ connectionId: z.string() }),
  "auth.sso_login":         z.object({ idpName: z.string() }),
}
```

### 13.4 Logger Helper (`src/lib/audit/log.ts`)

```ts
export async function createAuditLog<T extends keyof typeof AuditEvents>(
  action: T,
  data: {
    organizationId: string
    actorId: string
    actorEmail: string
    actorName: string
    metadata?: z.infer<typeof AuditEvents[T]>
    ipAddress?: string
    userAgent?: string
  }
): Promise<void>
```

Call at the end of every Server Action or route handler that mutates org data.

### 13.5 Dashboard UI (`/organizations/[orgSlug]/audit-logs`)

- shadcn `DataTable`: Actor, Action, Resource, IP Address, Timestamp.
- Filters: date range picker, action type dropdown, actor search input.
- Server-side pagination via Payload REST API.
- CSV export button — triggers `GET /api/orgs/[orgId]/audit-logs/export` (see Section 10.5).
- `owner` and `admin` only. `member` role is redirected to `/dashboard?error=forbidden`.

---

## 14. Webhooks System (Svix)

### 14.1 Architecture

**Svix** handles webhook delivery. It is MIT-licensed and runs as a Docker service. The Svix server manages: retries with exponential backoff, HMAC SHA-256 signatures, delivery logs, message replay, and an embeddable customer portal UI.

### 14.2 Docker Service

```yaml
# In docker-compose.yml and docker-compose.dev.yml
svix:
  image: svix/svix-server:latest
  ports:
    - "8071:8071"
  environment:
    SVIX_JWT_SECRET: ${SVIX_JWT_SECRET}
    SVIX_DB_DSN: ${DATABASE_URL}
    SVIX_REDIS_DSN: redis://redis:6379
  depends_on:
    - postgres
    - redis
```

**First-boot Svix auth token generation:**
```bash
# After containers are running:
docker compose exec svix svix-server jwt generate
# Copy the output token → set as SVIX_AUTH_TOKEN in .env
```

### 14.3 Svix Client (`src/lib/webhooks/svix.ts`)

```ts
import { Svix } from "svix"

export const svix = new Svix(process.env.SVIX_AUTH_TOKEN!, {
  serverUrl: process.env.SVIX_SERVER_URL!, // http://localhost:8071 in dev
})
```

### 14.4 Typed Event Catalog (`src/lib/webhooks/events.ts`)

```ts
export const WebhookEvents = {
  "member.invited":              z.object({ orgId: z.string(), email: z.string(), role: z.string() }),
  "member.removed":              z.object({ orgId: z.string(), userId: z.string() }),
  "member.role_changed":         z.object({ orgId: z.string(), userId: z.string(), newRole: z.string() }),
  "org.updated":                 z.object({ orgId: z.string(), changes: z.record(z.unknown()) }),
  "billing.subscription_activated": z.object({ orgId: z.string(), plan: z.string() }),
  "billing.subscription_cancelled": z.object({ orgId: z.string() }),
  "billing.plan_changed":        z.object({ orgId: z.string(), from: z.string(), to: z.string() }),
}
export type WebhookEventType = keyof typeof WebhookEvents
```

### 14.5 Send Helper

```ts
export async function sendWebhook<T extends WebhookEventType>(
  orgId: string,
  eventType: T,
  payload: z.infer<typeof WebhookEvents[T]>
): Promise<void> {
  await svix.message.create(orgId, { eventType, payload })
}
```

Call `sendWebhook()` alongside `createAuditLog()` after any significant org event.

### 14.6 Per-Org Svix Application

Each organization maps to one Svix "application". On org creation: `svix.application.create({ name: org.name, uid: org.id })`. Store returned `svixAppId` on the Payload org record. On org deletion: `svix.application.delete(svixAppId)`.

### 14.7 Dashboard UI

**`/organizations/[orgSlug]/webhooks`**
- Table: URL, enabled status, events, created date, Actions (disable, delete, send test).
- "Add Endpoint" button → dialog with URL input + event type multi-select checkboxes.
- On add: `svix.endpoint.create(svixAppId, { url, filterTypes })`.

**`/organizations/[orgSlug]/webhooks/[endpointId]`**
- Endpoint URL, secret (masked with copy button).
- Delivery attempts table: event type, HTTP status, timestamp, response time.
- "Replay" button per failed attempt: `svix.messageAttempt.resend(...)`.
- "Send Test Event" button.

**Embeddable App Portal (optional)**  
Generate magic link via `svix.authentication.appPortalAccess(svixAppId)`. Render as full-height `<iframe>` for a complete self-service webhook UI.

### 14.8 Operational Webhook Handler

`src/app/api/webhooks/svix/route.ts` — receives Svix operational events (e.g. endpoint permanently disabled after repeated failure). Verify Svix signature on every request before processing.

---

## 15. Feature Flags

### 15.1 Package

**`flags`** (Vercel Flags SDK) — free, open-source, Next.js App Router native. Does not require Vercel.

```bash
npm install flags
```

### 15.2 Data Storage — `FeatureFlags` Collection

```ts
// src/payload/collections/FeatureFlags.ts
// Fields:
{
  key: text,             // unique, indexed — e.g. "new-billing-ui"
  enabled: checkbox,
  description: text,
  rolloutPercentage: number,  // 0–100
  allowlist: json,       // array of orgId or userId strings
  environments: select,  // "all" | "production" | "staging" | "development"
}
```

Managed entirely via the **Payload Admin panel** at `/admin`. No custom flag UI needed.

### 15.3 Custom Adapter (`src/lib/flags/adapter.ts`)

```ts
import { flag } from "flags/next"
import { getPayload } from "payload"
import config from "@/payload/payload.config"

export function createFlag(key: string) {
  return flag<boolean>({
    key,
    async decide({ entities }) {
      const payload = await getPayload({ config })
      const result = await payload.find({
        collection: "feature-flags",
        where: { key: { equals: key } },
      })
      const record = result.docs[0]
      if (!record || !record.enabled) return false
      const orgId = entities?.org?.id
      if (orgId && (record.allowlist as string[])?.includes(orgId)) return true
      if (record.rolloutPercentage < 100) {
        const hash = orgId ? [...orgId].reduce((a, c) => a + c.charCodeAt(0), 0) : 0
        return hash % 100 < record.rolloutPercentage
      }
      return true
    },
  })
}
```

### 15.4 Flag Definitions (`src/lib/flags/flags.ts`)

```ts
export const newBillingUiFlag    = createFlag("new-billing-ui")
export const advancedAnalytics   = createFlag("advanced-analytics")
export const webhooksEnabledFlag = createFlag("webhooks")
```

### 15.5 Usage in Server Components

```tsx
const showNewBilling = await newBillingUiFlag()
if (showNewBilling) return <NewBillingUI />
return <LegacyBillingUI />
```

### 15.6 Usage in Middleware

Use `flags` SDK `precompute()` in middleware to evaluate all flags once per request and encode into a cookie. This avoids N DB round-trips per Server Component.

---

## 16. Usage Quotas & Rate Limiting

### 16.1 Architecture

Two-layer system using `@upstash/ratelimit` + Redis:

- **Rate Limiting** — per-IP sliding window protecting all `/api/*` routes against abuse. Applied in Next.js middleware.
- **Usage Quotas** — per-org monthly counters enforcing plan limits (e.g. "Free: 1,000 API calls/month"). Applied in Server Actions and route handlers.

### 16.2 Plan Definitions (`src/lib/quota/plans.ts`)

```ts
export const PLANS = {
  free: {
    apiCallsPerMonth: 1_000,
    membersPerOrg: 5,
    storageGb: 1,
    webhookEndpoints: 2,
  },
  pro: {
    apiCallsPerMonth: 50_000,
    membersPerOrg: 25,
    storageGb: 20,
    webhookEndpoints: 10,
  },
  enterprise: {
    apiCallsPerMonth: Infinity,
    membersPerOrg: Infinity,
    storageGb: Infinity,
    webhookEndpoints: Infinity,
  },
} as const

export type PlanKey = keyof typeof PLANS
```

Store the org's `plan` field in the Payload Organizations collection (default: `"free"`).

### 16.3 Redis + Limiter Setup (`src/lib/quota/limiter.ts`)

```ts
import { Ratelimit } from "@upstash/ratelimit"
import Redis from "ioredis"

const redis = new Redis(process.env.REDIS_URL!)

export const apiRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"),
  prefix: "rl:api",
})

export function createMonthlyQuotaLimiter(orgId: string, limit: number) {
  return new Ratelimit({
    redis,
    limiter: Ratelimit.fixedWindow(limit, "30 d"),
    prefix: `quota:${orgId}`,
  })
}
```

### 16.4 `checkQuota()` Helper (`src/lib/quota/check.ts`)

```ts
export async function checkQuota(
  orgId: string,
  plan: PlanKey,
  resource: keyof typeof PLANS["free"]
): Promise<{ allowed: boolean; remaining: number; limit: number }> {
  const limit = PLANS[plan][resource]
  if (limit === Infinity) return { allowed: true, remaining: Infinity, limit: Infinity }
  const limiter = createMonthlyQuotaLimiter(`${orgId}:${resource}`, limit as number)
  const result = await limiter.limit(orgId)
  if (result.remaining / (limit as number) < 0.2) {
    await maybeSendQuotaWarningEmail(orgId, resource, result.remaining, limit as number)
  }
  return { allowed: result.success, remaining: result.remaining, limit: result.limit }
}
```

**`maybeSendQuotaWarningEmail` signature:**
```ts
async function maybeSendQuotaWarningEmail(
  orgId: string,
  resource: string,
  remaining: number,
  limit: number
): Promise<void> {
  const redisKey = `quota:warn:${orgId}:${resource}`
  const alreadySent = await redis.get(redisKey)
  if (alreadySent) return
  // Send email via nodemailer using quota-warning.tsx template
  // Set Redis key with 30-day TTL so it only fires once per billing window
  await redis.set(redisKey, "1", "EX", 60 * 60 * 24 * 30)
}
```

### 16.5 Rate Limiting in Middleware

```ts
if (request.nextUrl.pathname.startsWith("/api/")) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown"
  const { success } = await apiRateLimiter.limit(ip)
  if (!success) return new NextResponse("Too many requests", { status: 429 })
}
```

### 16.6 Usage Dashboard (`/organizations/[orgSlug]/usage`)

- shadcn `Card` per resource: label, current/limit numbers, `Progress` bar.
- Color coding: green < 60%, yellow 60–80%, red > 80%.
- "Upgrade Plan" CTA → `/pricing`.
- Data fetched from `GET /api/orgs/[orgId]/usage` which reads Redis counters.
- Refresh button with TanStack Query `refetchInterval: 30_000`.

---

## 17. Payload CMS Configuration

### 17.1 Collections

**Users** — email, name, betterAuthUserId (indexed), avatar (Media). `auth: false`. See Section 6.3.

**Media** — S3 storage, image/jpeg + image/png + image/webp, sizes: thumbnail (150×150), card (400×400).

**Organizations** — name, slug, logo (Media), betterAuthOrgId (indexed), plan (select: free/pro/enterprise, default: free), svixAppId, stripeCustomerId, stripeSubscriptionId, stripeSubscriptionStatus (select: active/trialing/past_due/canceled/unpaid), stripePriceId, samlConnectionId.

**AuditLogs** — See Section 13.2.

**FeatureFlags** — See Section 15.2.

**Permissions** — See Section 29.3.

### 17.2 S3 Configuration

```ts
import { s3Storage } from "@payloadcms/storage-s3"

s3Storage({
  collections: { media: true },
  bucket: process.env.S3_BUCKET!,
  config: {
    region: process.env.S3_REGION!,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID!,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY!,
    },
    endpoint: process.env.S3_ENDPOINT, // MinIO in dev
  },
})
```

### 17.3 Migrations

```bash
# better-auth schema first
npx better-auth generate
npx better-auth migrate

# Then Payload schema
npx payload migrate:create --name init
npx payload migrate
```

Never use raw SQL. All Payload schema changes go through Payload migrations. Never mix better-auth and Payload migration files.

---

## 18. TanStack Query

### 18.1 Query Keys

```ts
export const queryKeys = {
  organizations: {
    all: ["organizations"] as const,
    list: () => [...queryKeys.organizations.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.organizations.all, "detail", slug] as const,
  },
  members:      { list: (orgId: string) => ["members", "list", orgId] as const },
  invitations:  { list: (orgId: string) => ["invitations", "list", orgId] as const },
  auditLogs:    { list: (orgId: string, filters: object) => ["audit-logs", orgId, filters] as const },
  usage:        { detail: (orgId: string) => ["usage", orgId] as const },
  session:      ["session"] as const,
  billing:      { detail: (orgId: string) => ["billing", orgId] as const },
  permissions:  { list: (orgId: string, filters?: object) => ["permissions", orgId, filters] as const },
}
```

### 18.2 Hooks

- `useOrganizations()`, `useOrganizationMembers(orgId)`, `useSession()`
- `useOrgInvitations(orgId)` — lists pending invitations
- `useAuditLogs(orgId, filters)` — paginated, server-side
- `useOrgUsage(orgId)` — reads quota counters, `refetchInterval: 30_000`
- `useOrgBilling(orgId)` — reads subscription status and plan from Payload org record
- `useOrgPermissions(orgId, filters?)` — lists granular permission records

---

## 19. Forms Pattern

```tsx
const schema = z.object({ ... })
const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) })
const mutation = useMutation({
  mutationFn: (data) => someAction(data),
  onSuccess: () => { queryClient.invalidateQueries(...); toast.success("Saved") },
  onError: (err) => toast.error(err.message),
})
const onSubmit = form.handleSubmit((data) => mutation.mutate(data))
```

Use shadcn `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage` everywhere.

---

## 20. Email System

### 20.1 Transport (`src/lib/email/send.ts`)

Nodemailer SMTP. Dev: MailHog catches all mail at `localhost:8025`.

### 20.2 Templates

- `welcome.tsx` — `{ name: string }`
- `reset-password.tsx` — `{ name: string, resetUrl: string }`
- `invite-member.tsx` — `{ inviterName: string, orgName: string, inviteUrl: string, expiresInHours: number }`
- `quota-warning.tsx` — `{ orgName: string, resource: string, percentUsed: number, upgradeUrl: string }`

---

## 21. Public Marketing Pages

### 21.1 Route Group `(marketing)`

Fully public. Separate `layout.tsx` with marketing nav + footer. No auth state required.

### 21.2 Top Navigation (`src/components/marketing/nav.tsx`)

- Logo + nav links: Features, Pricing, Blog, Changelog.
- Right: "Sign In" (ghost), "Get Started" (primary).
- Mobile: shadcn `Sheet` hamburger menu.
- Sticky; adds background + border-bottom on scroll via Intersection Observer.

### 21.3 Homepage (`/`)

Sections (top to bottom), each in a separate component:

1. **Hero** — Headline, subheadline, two CTA buttons ("Get Started" → `/register`, "View Demo" → scroll). Optional animated gradient background.
2. **Logo Bar** — "Trusted by teams at…" + 5 placeholder SVG logos.
3. **Features** — 3-column grid, lucide icons, title + description per card.
4. **How It Works** — 3-step numbered flow.
5. **Pricing** — 3 tiers (Free / Pro / Enterprise) as shadcn Cards. Pro tier has a ring border. Monthly/annual toggle via shadcn `Switch` (prices update, no real billing logic).
6. **Testimonials** — 3 quote cards.
7. **FAQ** — shadcn `Accordion`.
8. **CTA** — Bold headline + single CTA.
9. **Footer** — 4-column links + copyright.

Animate each section with `framer-motion`: `initial={{ opacity: 0, y: 20 }}`, `whileInView={{ opacity: 1, y: 0 }}`, `viewport={{ once: true }}`.

### 21.4 Features Page (`/features`)

Alternating left/right layout. Feature title, description, and a colored placeholder box (or SVG mockup) for each feature.

### 21.5 Pricing Page (`/pricing`)

Same 3-tier cards + a feature comparison table (`Table` from shadcn) listing all plan limits.

### 21.6 Blog (`/blog`, `/blog/[slug]`)

- **Index:** Grid of `BlogCard` — title, date, description, reading time, tag badge.
- **Post:** MDX via `next-mdx-remote`. Frontmatter spec: see Section 12.
- MDX component overrides for `h1`, `h2`, `h3`, `p`, `a`, `code`, `pre`, `blockquote`.
- Posts live in `/content/blog/*.mdx`. Seed 2 example posts.

### 21.7 Changelog (`/changelog`)

- MDX files in `/content/changelog/*.mdx`. Frontmatter spec: see Section 12.
- Vertical timeline: date + version badge left, content right.

### 21.8 Legal

- `/legal/privacy` and `/legal/terms` — prose layout, placeholder content.

### 21.9 SEO

- Every page exports `generateMetadata()` with `title`, `description`, `openGraph`.
- Install `next-sitemap`. Add `postbuild` script: `next-sitemap`. Generates `sitemap.xml` and `robots.txt`.

---

## 22. Theming & Design Conventions

- shadcn/ui `new-york` style.
- Tailwind CSS v4 with CSS custom properties.
- Primary brand color: shadcn/ui default slate. Do not override — leave for the product layer.
- Font: `next/font/google` with `Inter` (sans-serif). Applied in root `layout.tsx`.
- Border radius: shadcn default (`--radius: 0.5rem`).
- Dark mode via `next-themes`, toggle in user nav.
- `framer-motion` on marketing pages only. Dashboard uses CSS transitions.
- Sidebar: shadcn `Sidebar` (collapsible).
- Data tables: shadcn `DataTable` with column definitions.
- Toasts: `sonner`.
- Loading: `Skeleton` components.
- Destructive actions: `Dialog` with confirmation input (type the org name to confirm delete).
- Marketing nav: transparent → background + border on scroll.

---

## 23. Testing — Playwright

### 23.1 Configuration

```ts
export default defineConfig({
  testDir: "./tests/e2e",
  use: { baseURL: "http://localhost:3000", trace: "on-first-retry" },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile",   use: { ...devices["Pixel 5"] } },
  ],
  webServer: { command: "npm run dev", url: "http://localhost:3000", reuseExistingServer: !process.env.CI },
})
```

### 23.2 Test Specs

**`auth.spec.ts`**
- Register with valid data.
- Registration fails with existing email.
- Login with valid credentials.
- Login fails with wrong password.
- Forgot password sends email (MailHog mock).
- Logout works.

**`organizations.spec.ts`**
- Create org; slug auto-generated from name.
- Org switcher shows new org.
- Switch active org.
- Update org settings.
- Delete org (requires typing org name to confirm).

**`members.spec.ts`**
- Invite member by email.
- Pending invite appears in Pending tab.
- Cancel pending invitation.
- Change member role (owner only).
- Remove member.
- Member role cannot access settings (redirected to dashboard).

**`invitations.spec.ts`**
- Accept valid invitation token — user added to org.
- Expired invitation token shows error and redirects to login.
- Unauthenticated user visiting accept URL is redirected to login with callbackUrl preserved.

**`marketing.spec.ts`**
- Homepage loads with correct `<h1>` and CTA buttons.
- Nav links navigate correctly.
- Pricing page renders 3 tier cards.
- Blog index lists seed posts.
- Blog post page renders MDX content.
- Changelog page renders timeline entries.
- "Get Started" button navigates to `/register`.
- Legal pages load without errors.

**`audit-logs.spec.ts`**
- Creating an org produces `org.created` log entry.
- Inviting a member produces `member.invited` entry.
- Audit log table is visible to owner.
- Audit log table is visible to admin.
- Audit log table is NOT accessible to member role.
- Filter by action type filters correctly.
- CSV export triggers file download.

**`webhooks.spec.ts`**
- Owner adds a webhook endpoint.
- Endpoint appears in the list.
- Endpoint shows masked secret with copy button.
- "Send Test Event" creates a delivery attempt entry.
- Delivery attempt log shows status.
- Owner deletes an endpoint.

**`quota.spec.ts`**
- Usage dashboard shows plan name and resource cards.
- Resource cards have progress bars.
- API returns 429 when rate limit exceeded (mock).
- Server Action returns quota error when monthly limit hit (mock).

**`billing.spec.ts`**
- Billing page shows current plan (free by default).
- "Upgrade" button initiates Stripe Checkout (mock Stripe redirect).
- Stripe webhook `customer.subscription.created` updates org plan (mock webhook call).
- Stripe webhook `customer.subscription.deleted` downgrades org to free.
- Customer Portal button calls portal session endpoint and redirects.
- Plan downgrade reflected in usage dashboard.

**`sso.spec.ts`**
- SSO settings page visible to owner only.
- Create SAML connection form submits to Jackson API.
- SAML connection appears in settings after creation.
- Delete SAML connection removes it from settings.
- SSO login redirects to IdP (mock Jackson redirect).

**`permissions.spec.ts`**
- Permissions page visible to owner and admin.
- Owner can grant a permission for a specific resource.
- Granted permission appears in permissions table.
- Owner can revoke a permission.
- `checkPermission()` returns `true` for a granted action.
- `checkPermission()` returns `false` for an action not in the record.

### 23.3 Fixtures

`tests/fixtures/test-user.ts` — exports `createTestUser()` and `createTestOrg()` helpers that call the app API directly to seed test data before each spec.

---

## 24. Docker Setup

### 24.1 Production Services (`docker-compose.yml`)

- `app` — Next.js production build
- `postgres` — PostgreSQL 16
- `redis` — Redis 7
- `svix` — Svix webhook server
- `jackson` — BoxyHQ SAML Jackson (SSO)
- `posthog` — PostHog analytics (optional; can point to PostHog Cloud instead)

### 24.2 Development Services (`docker-compose.dev.yml`)

- `app` — Next.js dev server (source volume mounted)
- `postgres` — PostgreSQL 16
- `redis` — Redis 7
- `svix` — Svix webhook server
- `jackson` — BoxyHQ SAML Jackson
- `posthog` — PostHog analytics
- `mailhog` — SMTP catch-all at `http://localhost:8025`
- `minio` — S3-compatible local storage; console at `http://localhost:9001`

### 24.3 `Dockerfile` (Production)

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
RUN npm ci --only=production

FROM base AS builder
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["npm", "start"]
```

### 24.4 Environment Variables (`.env.example`)

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/starter_db

# Redis (self-hosted)
REDIS_URL=redis://localhost:6379

# better-auth
BETTER_AUTH_SECRET=change-me-minimum-32-chars
BETTER_AUTH_URL=http://localhost:3000

# S3 / MinIO
S3_BUCKET=my-bucket
S3_REGION=us-east-1
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_ENDPOINT=http://localhost:9000    # Remove for real AWS

# SMTP / MailHog
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM="Starter App <no-reply@example.com>"

# Svix (Webhooks)
SVIX_JWT_SECRET=change-me-svix-jwt-secret
SVIX_AUTH_TOKEN=                    # Generate via: docker compose exec svix svix-server jwt generate
SVIX_SERVER_URL=http://localhost:8071

# Upstash Redis (optional — for production managed Redis)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Payload Admin (optional — restrict /admin to specific email)
# ADMIN_EMAIL=you@example.com

# Stripe (Billing)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# Stripe Price IDs (from your Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...

# PostHog (Analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=http://localhost:8000   # or https://app.posthog.com
POSTHOG_PERSONAL_API_KEY=                        # for server-side feature flag evaluation

# BoxyHQ SAML Jackson (SSO)
JACKSON_URL=http://localhost:5225
JACKSON_API_KEY=                                 # generate a random secret
JACKSON_PRODUCT=starter                          # product identifier for Jackson
SAML_AUDIENCE=https://yourapp.com/api/auth/saml

```

---

## 25. Development Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "postbuild": "next-sitemap",
    "start": "next start",
    "lint": "next lint",
    "payload": "payload",
    "migrate": "payload migrate",
    "migrate:create": "payload migrate:create",
    "generate:types": "payload generate:types",
    "auth:generate": "better-auth generate",
    "auth:migrate": "better-auth migrate",
    "email:dev": "email dev --dir src/lib/email/templates --port 3001",
    "test": "playwright test",
    "test:ui": "playwright test --ui"
  }
}
```

---

## 26. Build Order for AI Agent

Implement in this sequence to avoid dependency issues:

1. **Scaffold** — `create-next-app`, install all deps, configure Tailwind, init shadcn.
2. **Shared Drizzle instance** — `src/lib/db/index.ts`. Payload must be initialized first since it owns the `drizzle` instance.
3. **Payload CMS** — `payload.config.ts`, all 5 collections (Users, Media, Organizations, AuditLogs, FeatureFlags), S3 adapter, API route. Set `auth: false` on Users. Add admin access function.
4. **better-auth** — `auth.ts` (using `drizzleAdapter(db)`), `auth-client.ts`, API route, `payload-access.ts` helper, `requireOrgRole()` helper.
5. **Database migrations** — Run `npm run auth:generate && npm run auth:migrate` first, then `npm run migrate:create -- --name init && npm run migrate`.
6. **`next.config.ts`** — Add `withPayload` wrapper, image remote patterns, transpile packages.
7. **Middleware** — Rate limiting → auth check → active org resolution → org membership guard.
8. **Email** — Nodemailer transport + all 4 React Email templates.
9. **TanStack Query** — Provider, query keys, base hooks.
10. **Auth Pages** — Login, Register, Forgot Password, Reset Password (shadcn blocks).
11. **Marketing Pages** — `(marketing)` layout (nav + footer), install `next-mdx-remote` + `framer-motion` + `next-sitemap`, build all sections, Homepage, Features, Pricing, Blog, Changelog, Legal.
12. **Dashboard Shell** — Sidebar, Header, Org Switcher, User Nav.
13. **Account Pages** — Profile, Security, Sessions.
14. **Server Actions** — `organization.ts`, `member.ts`, `account.ts` (all actions per Section 8).
15. **Organization Pages** — List, Create (dual-write), Overview, Members (with Pending tab), Settings.
16. **Invitation Flow** — `inviteMember()` action, `accept` route handler, `invitations.spec.ts`.
17. **Audit Logs** — `createAuditLog()` helper, instrument all mutating actions, build dashboard table UI, CSV export route.
18. **Feature Flags** — `flags` SDK adapter, flag definitions, instrument 2 example flags, manage via Payload admin.
19. **Usage Quotas** — Plan definitions, `@upstash/ratelimit` wrappers, `checkQuota()`, `maybeSendQuotaWarningEmail()`, middleware rate limiting, usage dashboard page.
20. **Webhooks (Svix)** — Add Svix Docker service, document first-boot token generation, Svix client singleton, typed event catalog, `sendWebhook()` helper, instrument org events, endpoint management UI.
21. **Error handling** — `error.tsx`, `not-found.tsx`, 403 redirect pattern, loading skeletons audit.
22. **Stripe Billing** — Stripe client singleton, plan-to-Price-ID map, `createCheckoutSession()` and `createPortalSession()` actions, Stripe webhook handler (`/api/webhooks/stripe`), sync handler that updates Payload org on subscription events, billing dashboard page, upgrade dialog, `BillingPortalButton`. Wire billing events to audit log and outbound webhooks.
23. **Analytics (PostHog)** — Add `PostHogProvider` to root layout, `posthog-node` server client, instrument key events (pageview, org created, plan upgraded, feature flag evaluated). Add `useAnalytics()` hook.
24. **SSO / SAML** — Add BoxyHQ Jackson Docker service, configure better-auth SAML plugin, `SSOSettings` page under org settings, SAML connection create/delete actions, audit events.
25. **Granular Permissions** — `Permissions` Payload collection, `checkPermission()` helper, `grantPermission()` and `revokePermission()` actions, permissions management page for owners.
26. **Docker** — Finalize Dockerfiles, docker-compose files (dev + prod), add Jackson + PostHog services.
27. **Tests** — Playwright config, fixtures, all spec files including `billing.spec.ts`, `sso.spec.ts`, `permissions.spec.ts`.
28. **README** — Full setup guide (see Section 27).

---

## 27. README Requirements

The README must cover:

- Prerequisites: Node 22+, Docker, pnpm/npm.
- One-command local dev: `docker-compose -f docker-compose.dev.yml up`.
- Manual setup: env vars, `npm run auth:generate`, `npm run auth:migrate`, `npm run migrate`, `npm run dev`.
- Migration commands: Payload (`migrate`, `migrate:create`) and better-auth (`auth:generate`, `auth:migrate`) — explain which to run and in what order.
- Email preview: `npm run email:dev`; MailHog at `localhost:8025`.
- MinIO local S3: console at `localhost:9001`, default credentials `minioadmin/minioadmin`.
- Svix setup: run `docker compose exec svix svix-server jwt generate` after first boot; copy output to `SVIX_AUTH_TOKEN`.
- Feature flag management: Payload admin at `/admin` → Feature Flags collection.
- Plan configuration: edit `src/lib/quota/plans.ts`.
- How to add a new audit event: add to `AuditEvents` in `events.ts`, call `createAuditLog()`.
- How to add a new webhook event: add to `WebhookEvents`, call `sendWebhook()`.
- How to add a new feature flag: call `createFlag("key")` and export from `flags.ts`.
- How to run tests: `npm run test`.
- Stripe setup: create products + prices in Stripe Dashboard, copy Price IDs to `.env`, run `stripe listen --forward-to localhost:3000/api/webhooks/stripe` in dev.
- PostHog setup: self-hosted (docker-compose) or PostHog Cloud; copy project API key to `.env`.
- SSO / SAML setup: add BoxyHQ Jackson service, configure SAML connection in org settings, test with a SAML IdP (e.g. Okta developer account).
- Full folder structure overview.
- Environment variable reference table (all vars, descriptions, required/optional).
- Deployment checklist: run both migration sets, real S3, real SMTP, Svix Cloud or self-hosted, managed Redis, set all secrets, restrict `/admin` via `ADMIN_EMAIL`, Stripe webhook endpoint registered in Stripe Dashboard, PostHog Cloud or self-hosted PostHog, BoxyHQ Jackson or SAML IdP.

---

## 28. Previously Out of Scope — Now In Scope (v4.0)

All four items previously listed as out-of-scope are now fully specified and must be implemented:

- **Billing / Stripe integration** — See Section 29.
- **Analytics / event tracking** — See Section 30.
- **SSO / SAML enterprise auth** — See Section 31.
- **Granular per-resource permissions** — See Section 32.

---

## 29. Billing — Stripe Integration

### 29.1 Architecture

Stripe manages subscription lifecycle. The application stores minimal Stripe data on the Payload Organizations record (`stripeCustomerId`, `stripeSubscriptionId`, `stripeSubscriptionStatus`, `stripePriceId`). The Stripe Dashboard and Customer Portal are the source of truth for payment method, invoice history, and cancellation.

### 29.2 Stripe Client (`src/lib/billing/stripe.ts`)

```ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
  typescript: true,
})
```

### 29.3 Plan-to-Price-ID Map (`src/lib/billing/plans.ts`)

```ts
export const STRIPE_PRICES = {
  pro: {
    monthly:    process.env.STRIPE_PRICE_PRO_MONTHLY!,
    yearly:     process.env.STRIPE_PRICE_PRO_YEARLY!,
  },
  enterprise: {
    monthly:    process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
  },
} as const

export type BillingInterval = "monthly" | "yearly"
```

### 29.4 Checkout Flow

1. User clicks "Upgrade" on the billing page or pricing section.
2. `createCheckoutSession()` Server Action is called with `{ orgId, priceId, successUrl, cancelUrl }`.
3. Action creates or retrieves a Stripe Customer for the org:
   - If `stripeCustomerId` exists on the Payload org record, use it.
   - Otherwise: `stripe.customers.create({ name: org.name, metadata: { orgId } })` and save `stripeCustomerId` to Payload.
4. `stripe.checkout.sessions.create({ customer, mode: "subscription", line_items: [{ price: priceId, quantity: 1 }], success_url, cancel_url })`.
5. Return `{ url: session.url }` — the client redirects to Stripe-hosted Checkout.
6. On success, Stripe fires `checkout.session.completed` → webhook handler (Section 29.6) syncs the org plan.

### 29.5 Customer Portal (`src/lib/billing/portal.ts`)

```ts
export async function createPortalSession(orgId: string, returnUrl: string) {
  const org = await getActivePayloadOrg() // existing helper
  if (!org?.stripeCustomerId) throw new Error("No billing account found.")
  const session = await stripe.billingPortal.sessions.create({
    customer: org.stripeCustomerId,
    return_url: returnUrl,
  })
  return session.url
}
```

`GET /api/billing/portal` route handler calls `createPortalSession()` and issues a `redirect()`. The "Manage Billing" button in the billing page links to this route.

### 29.6 Stripe Webhook Handler (`src/app/api/webhooks/stripe/route.ts`)

Verify Stripe signature on every request using `stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)`. Handle the following events:

| Stripe Event | Action |
|---|---|
| `checkout.session.completed` | Update Payload org: set `stripeSubscriptionId`, `stripeSubscriptionStatus: "active"`, `stripePriceId`, resolve `plan` from Price ID. Fire `billing.subscription_activated` audit + webhook. |
| `customer.subscription.updated` | Update `stripeSubscriptionStatus` and `stripePriceId` on Payload org. If price changed, update `plan`. Fire `billing.plan_changed` audit + webhook if plan changed. |
| `customer.subscription.deleted` | Set `plan: "free"`, `stripeSubscriptionStatus: "canceled"`, clear `stripeSubscriptionId`. Fire `billing.subscription_cancelled` audit + webhook. |
| `invoice.payment_failed` | Set `stripeSubscriptionStatus: "past_due"` on Payload org. Send `quota-warning.tsx` email variant for payment failure. |

**Resolving `plan` from Price ID:**
```ts
function planFromPriceId(priceId: string): PlanKey {
  if (priceId === process.env.STRIPE_PRICE_PRO_MONTHLY || priceId === process.env.STRIPE_PRICE_PRO_YEARLY) return "pro"
  if (priceId === process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY) return "enterprise"
  return "free"
}
```

### 29.7 Billing Dashboard Page (`/organizations/[orgSlug]/settings/billing`)

Add a "Billing" tab to org settings (owner + admin). Displays:

- Current plan name and status badge (active / trialing / past_due / canceled).
- Renewal date (from `stripeSubscriptionStatus` + Stripe API call to `stripe.subscriptions.retrieve()`).
- "Upgrade Plan" button (owner only) — opens `UpgradeDialog`.
- "Manage Billing" button — links to `/api/billing/portal`.

**`UpgradeDialog` component** (`src/components/billing/upgrade-dialog.tsx`):
- shadcn `Dialog` with plan cards (Pro Monthly, Pro Yearly, Enterprise).
- Highlights current plan; disables it.
- On select: calls `createCheckoutSession()` and `router.push(checkoutUrl)`.

### 29.8 Email Template — `billing-alert.tsx`

```ts
// Props:
{ orgName: string, event: "payment_failed" | "subscription_cancelled" | "trial_ending", daysRemaining?: number, portalUrl: string }
```

Sent from the Stripe webhook handler for `invoice.payment_failed` and `customer.subscription.deleted`.

### 29.9 Quota Plan Sync

The existing `checkQuota()` helper reads `plan` from the Payload org record. Because the Stripe webhook handler keeps this in sync, quota enforcement automatically reflects the current subscription without any additional coupling.

---

## 30. Analytics — PostHog

### 30.1 Architecture

PostHog runs as a Docker sidecar in dev (`http://localhost:8000`) or as PostHog Cloud in production (`https://app.posthog.com`). Two integration surfaces:

- **`posthog-js`** — client-side pageview tracking, click events, session replay, and A/B tests.
- **`posthog-node`** — server-side event capture from Server Actions and route handlers where the client SDK is not available.

### 30.2 Installation

```bash
npm install posthog-js posthog-node
```

### 30.3 Client Provider (`src/lib/analytics/client.tsx`)

```tsx
"use client"
import posthog from "posthog-js"
import { PostHogProvider as PHProvider } from "posthog-js/react"
import { useEffect } from "react"

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: false, // handled by PostHogPageView below
      persistence: "localStorage",
    })
  }, [])
  return <PHProvider client={posthog}>{children}</PHProvider>
}

// Add to root layout.tsx — wraps the entire app
```

**Pageview tracking** — add a `PostHogPageView` client component to the root layout that calls `posthog.capture("$pageview")` on `usePathname()` change.

### 30.4 Server Client (`src/lib/analytics/server.ts`)

```ts
import { PostHog } from "posthog-node"

export const posthogServer = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com" }
)
```

Call `posthogServer.capture({ distinctId, event, properties })` from Server Actions. Always call `await posthogServer.shutdown()` in test teardown.

### 30.5 Instrumented Events

| Event | Where Fired | Properties |
|---|---|---|
| `org_created` | `createOrg()` server action | `{ orgId, orgName, plan: "free" }` |
| `org_deleted` | `deleteOrg()` server action | `{ orgId }` |
| `member_invited` | `inviteMember()` server action | `{ orgId, role }` |
| `plan_upgraded` | Stripe webhook — `checkout.session.completed` | `{ orgId, plan, interval }` |
| `plan_downgraded` | Stripe webhook — `customer.subscription.deleted` | `{ orgId }` |
| `feature_flag_evaluated` | `createFlag().decide()` adapter | `{ flagKey, result, orgId }` |
| `quota_exceeded` | `checkQuota()` when `allowed: false` | `{ orgId, resource, limit }` |
| `sso_login` | better-auth SAML callback | `{ orgId, idpName }` |

### 30.6 Identify + Group

After login, call `posthog.identify(userId, { email, name })` client-side. After org switch, call `posthog.group("company", orgId, { name: orgName, plan })` to associate events with the org. This enables PostHog's group analytics for per-org funnels.

### 30.7 Session Replay

Session replay is enabled by default in PostHog (`session_recording: true` in `posthog.init`). Mask sensitive fields by adding `ph-no-capture` class to password inputs and payment form elements. The Stripe Checkout redirect means no payment data is ever recorded.

### 30.8 `useAnalytics()` Hook (`src/hooks/use-analytics.ts`)

```ts
import posthog from "posthog-js"

export function useAnalytics() {
  return {
    track: (event: string, properties?: Record<string, unknown>) =>
      posthog.capture(event, properties),
    identify: (userId: string, traits?: Record<string, unknown>) =>
      posthog.identify(userId, traits),
  }
}
```

---

## 31. SSO / SAML Enterprise Auth

### 31.1 Architecture

BoxyHQ SAML Jackson runs as a sidecar Docker service. Jackson handles SAML 2.0 SP/IdP metadata, assertion parsing, and the callback flow. The application sees only an OAuth-like redirect exchange — no raw SAML XML in app code. better-auth's SAML plugin bridges Jackson to the existing session model.

### 31.2 Docker Service

```yaml
# Add to docker-compose.yml and docker-compose.dev.yml
jackson:
  image: boxyhq/jackson:latest
  ports:
    - "5225:5225"
  environment:
    DB_ENGINE: sql
    DB_TYPE: postgres
    DB_URL: ${DATABASE_URL}
    NEXTAUTH_URL: ${NEXT_PUBLIC_APP_URL}
    NEXTAUTH_SECRET: ${BETTER_AUTH_SECRET}
    JACKSON_API_KEY: ${JACKSON_API_KEY}
    PRODUCT: ${JACKSON_PRODUCT}
    SAML_AUDIENCE: ${SAML_AUDIENCE}
  depends_on:
    - postgres
```

Jackson uses the same PostgreSQL instance (separate tables prefixed `jackson_`). Never modify Jackson's tables directly.

### 31.3 better-auth SAML Plugin

```ts
// src/lib/auth/auth.ts — add to plugins array
import { saml } from "better-auth/plugins/saml"

saml({
  jacksonUrl: process.env.JACKSON_URL!,
  jacksonApiKey: process.env.JACKSON_API_KEY!,
  product: process.env.JACKSON_PRODUCT!,
})
```

This registers `/api/auth/saml/authorize` and `/api/auth/saml/callback` routes automatically.

### 31.4 SAML Connection Management

#### Per-Org SAML Connection

Each org can have at most one SAML connection. Store `samlConnectionId` on the Payload Organizations record (nullable string). Connections are scoped to `tenant = orgId` in Jackson.

**Creating a connection:**
```ts
// src/lib/actions/sso.ts
export async function createSAMLConnection(data: {
  orgId: string
  metadataXml?: string
  metadataUrl?: string
}) {
  await requireOrgRole("owner")
  const res = await fetch(`${process.env.JACKSON_URL}/api/v1/saml/config`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Api-Key ${process.env.JACKSON_API_KEY}`,
    },
    body: JSON.stringify({
      name: `org-${data.orgId}`,
      tenant: data.orgId,
      product: process.env.JACKSON_PRODUCT,
      rawMetadata: data.metadataXml,
      metadataUrl: data.metadataUrl,
      redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
      defaultRedirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    }),
  })
  const { data: conn } = await res.json()
  await payload.update({ collection: "organizations", where: { betterAuthOrgId: { equals: data.orgId } }, data: { samlConnectionId: conn.clientID } })
  await createAuditLog("sso.connection_created", { ... })
}
```

**Deleting a connection:**
```ts
export async function deleteSAMLConnection(orgId: string) {
  await requireOrgRole("owner")
  const org = await getActivePayloadOrg()
  if (!org?.samlConnectionId) return
  await fetch(`${process.env.JACKSON_URL}/api/v1/saml/config/${org.samlConnectionId}`, {
    method: "DELETE",
    headers: { Authorization: `Api-Key ${process.env.JACKSON_API_KEY}` },
  })
  await payload.update({ collection: "organizations", where: { betterAuthOrgId: { equals: orgId } }, data: { samlConnectionId: null } })
  await createAuditLog("sso.connection_deleted", { ... })
}
```

### 31.5 SSO Settings Page (`/organizations/[orgSlug]/settings/sso`)

Add an "SSO" tab to org settings (owner only). Displays:

- Current connection status: connected IdP name (from Jackson) or "Not configured".
- **Setup form** (when no connection):
  - Radio: "Paste metadata XML" / "Enter metadata URL".
  - Textarea (XML) or input (URL).
  - "Connect IdP" button → calls `createSAMLConnection()`.
- **Connected state** (when connection exists):
  - IdP name, Entity ID (read-only).
  - SP metadata download link: ACS URL, SP Entity ID, SP metadata XML.
  - "Test SSO Login" button — triggers a SAML authorize redirect in a new tab.
  - "Delete Connection" button → calls `deleteSAMLConnection()` with confirmation dialog.

### 31.6 SSO Login Flow

1. User navigates to `/login`.
2. If the user's email domain matches an org with a SAML connection, a "Sign in with SSO" button appears below the email/password form.
3. Clicking it calls `authClient.signIn.saml({ email })` — better-auth resolves the connection via Jackson and redirects to the IdP.
4. IdP authenticates and posts the SAML assertion to `/api/auth/saml/callback`.
5. better-auth creates or matches the user record, creates a session, and redirects to `/dashboard`.
6. Server-side: capture `auth.sso_login` audit event and `sso_login` PostHog event.

**Email domain matching:**
```ts
// On login page — check if email domain has SAML configured
async function hasSAMLConnection(email: string): Promise<boolean> {
  const domain = email.split("@")[1]
  const res = await fetch(`${process.env.JACKSON_URL}/api/v1/saml/config?tenant=domain:${domain}&product=${process.env.JACKSON_PRODUCT}`, {
    headers: { Authorization: `Api-Key ${process.env.JACKSON_API_KEY}` },
  })
  const { data } = await res.json()
  return data?.length > 0
}
```

### 31.7 Audit Log Events

| Event | Trigger |
|---|---|
| `sso.connection_created` | `createSAMLConnection()` |
| `sso.connection_deleted` | `deleteSAMLConnection()` |
| `auth.sso_login` | better-auth SAML callback |

---

## 32. Granular Per-Resource Permissions

### 32.1 Architecture

The three-role model (`owner` / `admin` / `member`) covers org-level authorization. Granular permissions add a second authorization layer for individual resources (e.g. "user X can comment on but not delete Project Y"). This is implemented as a lightweight custom system — not a full ABAC engine.

**Data model:** A `Permissions` Payload collection stores flat permission records. At authorization time, `checkPermission()` queries this collection and evaluates the requested action against the stored `actions[]` array.

### 32.2 `Permissions` Collection (`src/payload/collections/Permissions.ts`)

```ts
// Fields:
{
  organizationId: text,       // scope to org; indexed
  subjectId:      text,       // better-auth userId or orgId; indexed
  subjectType:    select,     // "user" | "org_role" (e.g. grant to all admins)
  resourceType:   text,       // e.g. "project" | "document" | "api_key"
  resourceId:     text,       // UUID of the specific resource; "*" for wildcard
  actions:        array[text], // e.g. ["read", "comment"] or ["read", "write", "delete"]
  grantedBy:      text,       // actorId who granted this
  expiresAt:      date,        // optional — null means indefinite
}
```

Index: `(organizationId, subjectId, resourceType, resourceId)` — composite index for fast permission lookups.

Access: read/write restricted to `owner` via `requireOrgRole("owner")`. No user-facing write API beyond the management UI.

### 32.3 `checkPermission()` Helper (`src/lib/permissions/check.ts`)

```ts
export async function checkPermission(params: {
  orgId: string
  userId: string
  resourceType: string
  resourceId: string
  action: string
}): Promise<boolean> {
  const payload = await getPayload({ config })
  const now = new Date()

  const result = await payload.find({
    collection: "permissions",
    where: {
      organizationId: { equals: params.orgId },
      subjectId:      { equals: params.userId },
      resourceType:   { equals: params.resourceType },
      resourceId:     { in: [params.resourceId, "*"] },   // wildcard support
      or: [
        { expiresAt: { exists: false } },
        { expiresAt: { greater_than: now.toISOString() } },
      ],
    },
    limit: 10,
  })

  return result.docs.some((perm) => (perm.actions as string[]).includes(params.action))
}
```

### 32.4 Type Definitions (`src/lib/permissions/types.ts`)

```ts
export type ResourceType = "project" | "document" | "api_key" | string

export const RESOURCE_ACTIONS: Record<ResourceType, string[]> = {
  project:  ["read", "write", "delete", "invite"],
  document: ["read", "comment", "write", "delete"],
  api_key:  ["read", "rotate", "delete"],
}

export type GrantPermissionInput = {
  orgId:        string
  subjectId:    string
  subjectType:  "user" | "org_role"
  resourceType: ResourceType
  resourceId:   string
  actions:      string[]
  expiresAt?:   Date
}
```

### 32.5 Server Actions (`src/lib/actions/permissions.ts`)

See Section 8.5 for the full actions catalog. Implementation notes:

- `grantPermission()` — validates that `actions` is a non-empty subset of `RESOURCE_ACTIONS[resourceType]`. Upserts if a record already exists for the same `(orgId, subjectId, resourceType, resourceId)` tuple. Fires `permission.granted` audit event.
- `revokePermission()` — deletes by `permissionId`. Fires `permission.revoked` audit event.
- `listPermissions()` — returns paginated records filtered by `orgId`, with optional `resourceType` and `resourceId` filters.

### 32.6 Permissions Dashboard Page (`/organizations/[orgSlug]/permissions`)

Owner + admin only. Displays:

- Filter bar: resource type dropdown, resource ID input, subject (user) search.
- `PermissionsTable` component — columns: Subject, Resource Type, Resource ID, Actions Granted, Granted By, Expires, Actions (revoke button).
- "Grant Permission" button → `GrantPermissionDialog`.

**`GrantPermissionDialog`** (`src/components/permissions/grant-permission-dialog.tsx`):
- Member search input (autocomplete from `useOrganizationMembers()`).
- Resource type select (drives the actions checklist below).
- Resource ID input (free text — the product layer provides autocomplete for known resource types).
- Actions multi-select checkboxes (dynamically populated from `RESOURCE_ACTIONS[resourceType]`).
- Optional expiry date picker.
- "Grant" button → calls `grantPermission()` action.

### 32.7 Usage Pattern in Product Layer

```ts
// In a Server Component or Server Action that guards a product-specific resource:
const { allowed } = await checkPermission({
  orgId:        session.session.activeOrganizationId!,
  userId:       session.user.id,
  resourceType: "project",
  resourceId:   projectId,
  action:       "write",
})
if (!allowed) redirect("/dashboard?error=forbidden")
```

The starter ships `checkPermission()` and the management UI. The product layer is responsible for calling it around its own resources. This is intentional — the starter cannot know what resource types a product will define.

### 32.8 Relationship to RBAC

Granular permissions **supplement** the three-role model — they do not replace it. Evaluation order in product code should be:

1. Check RBAC role via `requireOrgRole()` — if the role grants access (e.g. `owner` always has all permissions), short-circuit to allow.
2. If RBAC does not grant access, check granular permissions via `checkPermission()`.
3. If neither grants access, deny.

This means granular permissions only need to be granted for resources where the default role-based access is insufficient.

---

*End of PRD v4.0*
