import Link from "next/link";
import type { Metadata } from "next";

import { MotionSection } from "@/components/marketing/motion-section";

export const metadata: Metadata = {
  title: "Features",
  description:
    "Multi-tenant orgs, collaboration, and guardrails—what ships with Blank SaaS.",
  openGraph: {
    title: "Features — Blank SaaS",
    description:
      "Multi-tenant orgs, collaboration, and guardrails—what ships with Blank SaaS.",
  },
};

const blocks = [
  {
    title: "Organizations & members",
    body:
      "Create workspaces, invite people, and keep roles understandable as you grow toward granular permissions.",
    side: "left" as const,
  },
  {
    title: "Auth that fits Next.js",
    body:
      "Email login, verification, and password reset wired to transactional email—extend with SSO when you are ready.",
    side: "right" as const,
  },
  {
    title: "Quotas & rate limits",
    body:
      "Plan-aware limits help you enforce fair use before you wire full billing—aligned with your product tiers.",
    side: "left" as const,
  },
  {
    title: "Billing & Stripe",
    body:
      "Checkout and customer portal hooks line up with quota keys in code—swap Stripe prices while keeping PLANS as the source of limits.",
    side: "right" as const,
  },
  {
    title: "Payload CMS for operators",
    body:
      "Give admins a real UI for content and configuration while your app stays in the App Router.",
    side: "left" as const,
  },
  {
    title: "Webhooks & integrations",
    body:
      "Outbound org webhooks via Svix and inbound Stripe/Svix routes—so automation stays outside your core request path.",
    side: "right" as const,
  },
  {
    title: "Observability hooks",
    body:
      "PostHog wiring for product analytics and optional Sentry for errors—each gated by env so you enable them when you are ready.",
    side: "left" as const,
  },
];

export default function FeaturesPage() {
  return (
    <main className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-semibold tracking-tight">Features</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          The project <strong className="text-foreground">README</strong> has the full feature table
          (what, why, and which env vars to set). This page is a short tour of the major pillars—see{" "}
          <Link href="/pricing" className="font-medium text-foreground underline underline-offset-4">
            Pricing
          </Link>{" "}
          for example tiers and <Link className="font-medium text-foreground underline underline-offset-4" href="/">the homepage</Link> for positioning.
        </p>
        <div className="mt-16 flex flex-col gap-20">
          {blocks.map((b) => (
            <MotionSection key={b.title}>
              <div
                className={`grid items-center gap-10 md:grid-cols-2 ${
                  b.side === "right" ? "md:[&>div:first-child]:order-2" : ""
                }`}
              >
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">
                    {b.title}
                  </h2>
                  <p className="mt-3 text-muted-foreground">{b.body}</p>
                </div>
                <div
                  className={`flex min-h-[200px] items-center justify-center rounded-xl border bg-muted/40 ${
                    b.side === "right" ? "md:order-1" : ""
                  }`}
                >
                  <span className="text-sm font-medium text-muted-foreground">
                    Illustration placeholder
                  </span>
                </div>
              </div>
            </MotionSection>
          ))}
        </div>
      </div>
    </main>
  );
}
