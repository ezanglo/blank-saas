import {
  FileJson2,
  Gauge,
  KeyRound,
  Lock,
  Package,
  Server,
  TestTube2,
  Truck,
} from "lucide-react";

import { MotionSection } from "@/components/marketing/motion-section";

/** Second dokploy-style grid: ops & delivery adjacent to product features. */
const items = [
  {
    icon: KeyRound,
    title: "Better Auth",
    description: "Sessions, email auth, org APIs—extend with SSO when your customers require it.",
  },
  {
    icon: Lock,
    title: "SAML when you need it",
    description: "Enterprise SSO path is already wired; configure providers per organization.",
  },
  {
    icon: Package,
    title: "Payload admin",
    description: "Content and configuration UIs for operators without a second deployment story.",
  },
  {
    icon: FileJson2,
    title: "Type-safe config",
    description: "Zod at the edges, generated Payload types, and migrations you generate—not hand-edit.",
  },
  {
    icon: Gauge,
    title: "Docker & Compose",
    description: "Local Postgres, Redis, MailHog, MinIO, and Svix—bring the stack up with one compose file.",
  },
  {
    icon: Server,
    title: "S3-compatible uploads",
    description: "Payload storage adapter works with MinIO locally and S3-compatible endpoints in prod.",
  },
  {
    icon: TestTube2,
    title: "Vitest & Playwright",
    description: "Unit, integration, and E2E conventions wired in CI so changes stay safe as you fork.",
  },
  {
    icon: Truck,
    title: "Deploy anywhere Node runs",
    description: "No vendor-specific runtime—Vercel, Docker, or a VPS; headers and runbooks stay the same.",
  },
] as const;

export function HomeComprehensive() {
  return (
    <MotionSection className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
          From auth to deploy—you stay in control
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-center text-lg text-muted-foreground">
          The pieces around your product code: identity, admin, storage, local dev parity, and how to
          ship without locking to one host.
        </p>
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm transition-colors hover:bg-muted/30"
            >
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                <Icon className="size-5 text-foreground" aria-hidden />
              </div>
              <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
