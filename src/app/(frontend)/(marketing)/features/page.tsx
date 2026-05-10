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
    title: "Payload CMS for operators",
    body:
      "Give admins a real UI for content and configuration while your app stays in the App Router.",
    side: "right" as const,
  },
];

export default function FeaturesPage() {
  return (
    <main className="px-6 py-12 md:py-16">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-4xl font-semibold tracking-tight">Features</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          A guided tour of the major pillars—each section is a launch point for
          deeper docs in later phases.
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
