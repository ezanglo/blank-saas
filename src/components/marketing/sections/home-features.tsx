import {
  Building2,
  CreditCard,
  Database,
  Mail,
  Radar,
  Shield,
  Users,
  Webhook,
  Workflow,
} from "lucide-react";

import { MotionSection } from "@/components/marketing/motion-section";

const items = [
  {
    icon: Building2,
    title: "Organizations first",
    description:
      "Workspaces, members, and invitations—roles stay understandable as you grow into granular permissions.",
  },
  {
    icon: Users,
    title: "Collaboration",
    description:
      "Switch org context, invite teammates, and keep tenant data scoped without rolling your own RBAC from scratch.",
  },
  {
    icon: Shield,
    title: "Rate limits & quotas",
    description:
      "Plan-aware limits so usage stays predictable before you wire every edge of billing.",
  },
  {
    icon: CreditCard,
    title: "Stripe-ready billing",
    description:
      "Checkout and portal hooks aligned with quota keys in code—bring your own Stripe prices.",
  },
  {
    icon: Webhook,
    title: "Svix outbound webhooks",
    description:
      "Customer-facing webhooks with signing and delivery semantics, not raw POST in your API routes.",
  },
  {
    icon: Database,
    title: "Payload on Postgres",
    description:
      "Operators get a real CMS admin; you keep one schema and migrations through Payload’s Postgres adapter.",
  },
  {
    icon: Mail,
    title: "Transactional email",
    description:
      "React Email templates and SMTP—verify accounts, invites, and alerts without a second mail system.",
  },
  {
    icon: Radar,
    title: "Optional observability",
    description:
      "PostHog and Sentry are env-gated so you enable analytics and errors when you deploy—not by default.",
  },
  {
    icon: Workflow,
    title: "Audit-friendly patterns",
    description:
      "Audit log hooks for sensitive actions so you can explain who did what when customers ask.",
  },
] as const;

export function HomeFeatures() {
  return (
    <MotionSection id="features" className="bg-muted/25 px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          Built for multi-tenant products
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-muted-foreground">
          A single codebase that covers the boring cross-cutting layers—so you spend time on features
          customers pay for, not plumbing experiments.
        </p>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm transition-colors hover:border-border"
            >
              <Icon className="size-9 text-primary" aria-hidden />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
