import { MotionSection } from "@/components/marketing/motion-section";
import { cn } from "@/lib/utils";

type StackGroup = {
  title: string;
  packages: readonly string[];
  why: string;
};

const groups: StackGroup[] = [
  {
    title: "App & UI",
    packages: [
      "next",
      "react",
      "tailwindcss",
      "shadcn",
      "radix-ui",
      "framer-motion",
      "react-hook-form",
      "zod",
    ],
    why:
      "Next.js App Router plus React 19 for server/client boundaries; Tailwind 4 and shadcn/ui (Radix primitives) for accessible components you own; Framer Motion for light marketing motion; Zod and React Hook Form for typed forms end to end.",
  },
  {
    title: "CMS & database",
    packages: [
      "payload",
      "@payloadcms/db-postgres",
      "@payloadcms/storage-s3",
      "drizzle-orm",
      "pg",
    ],
    why:
      "Payload 3 gives operators an admin UI and a real content/data layer on Postgres. Drizzle aligns with Payload’s Postgres adapter; the S3 storage plugin covers uploads to MinIO or AWS without a second upload pipeline.",
  },
  {
    title: "Auth & organizations",
    packages: ["better-auth", "@better-auth/sso"],
    why:
      "Better Auth handles sessions, org membership, invites, and email flows out of the box. The SSO plugin adds SAML for enterprises when you are ready—no parallel auth system to maintain.",
  },
  {
    title: "Billing & external webhooks",
    packages: ["stripe", "svix"],
    why:
      "Stripe covers checkout, portal, and subscription events this codebase already wires to quotas. Svix powers first-class org webhooks (signing, retries) so your customers’ automations are not ad hoc HTTP calls.",
  },
  {
    title: "Client data & tables",
    packages: [
      "@tanstack/react-query",
      "@tanstack/react-table",
      "@dnd-kit/*",
      "recharts",
    ],
    why:
      "TanStack Query caches server state in the dashboard; TanStack Table and @dnd-kit power sortable, accessible data surfaces. Recharts is used where the sample dashboard needs charts—you can swap it if you standardize on another viz layer.",
  },
  {
    title: "Limits, flags, email",
    packages: [
      "@upstash/ratelimit",
      "ioredis",
      "flags",
      "@react-email/components",
      "nodemailer",
    ],
    why:
      "Upstash (or self-hosted Redis via ioredis) backs API rate limiting; the flags package gates features like granular permissions. React Email plus Nodemailer renders transactional HTML and sends through SMTP in production.",
  },
  {
    title: "Observability (optional)",
    packages: ["@sentry/nextjs", "posthog-js", "posthog-node"],
    why:
      "Sentry and PostHog are env-gated: turn them on when you deploy—no stub analytics SDK shipped as mandatory telemetry.",
  },
  {
    title: "Tests & quality",
    packages: ["vitest", "@playwright/test", "eslint", "typescript"],
    why:
      "Vitest runs unit and integration suites against your business logic; Playwright covers E2E flows in CI. TypeScript and ESLint are first-class so refactors stay safe as you strip or extend modules.",
  },
];

function PkgBadge({ name }: { name: string }) {
  return (
    <code
      className={cn(
        "inline-flex max-w-full items-center rounded-md border border-border bg-muted/80 px-2 py-1 font-mono text-xs font-medium text-foreground",
        "break-all sm:break-normal",
      )}
    >
      {name}
    </code>
  );
}

export function HomeTechStack() {
  return (
    <MotionSection id="stack" className="border-y bg-background px-6 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Stack &amp; rationale
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-muted-foreground">
          Dependency groups from <code className="rounded bg-muted px-1.5 py-0.5 text-sm">package.json</code>
          — what you&apos;ll edit when you fork.
        </p>
        <div className="mt-14 grid gap-6 lg:grid-cols-2">
          {groups.map((g) => (
            <article
              key={g.title}
              className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm"
            >
              <h3 className="text-lg font-semibold tracking-tight">{g.title}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {g.packages.map((p) => (
                  <PkgBadge key={p} name={p} />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {g.why}
              </p>
            </article>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
