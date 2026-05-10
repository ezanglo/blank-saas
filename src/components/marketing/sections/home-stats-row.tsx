import { MotionSection } from "@/components/marketing/motion-section";

/**
 * Dokploy-style stats strip, without vanity metrics: anchor expectations on real stack facts.
 */
const stats = [
  {
    label: "App framework",
    value: "Next.js 16",
    hint: "App Router, React 19, React Compiler ready",
  },
  {
    label: "CMS & API",
    value: "Payload 3",
    hint: "Admin UI, Postgres adapter, S3 storage plugin",
  },
  {
    label: "Auth",
    value: "Better Auth",
    hint: "Sessions, orgs, invites, optional SAML",
  },
  {
    label: "Data store",
    value: "PostgreSQL",
    hint: "Drizzle + Payload migrations",
  },
] as const;

export function HomeStatsRow() {
  return (
    <MotionSection className="border-y bg-muted/30 px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="text-center text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Stack at a glance
        </p>
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight md:text-3xl">
          Facts, not marketing numbers
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border/80 bg-card px-5 py-6 text-center shadow-sm"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {s.label}
              </p>
              <p className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">{s.value}</p>
              <p className="mt-2 text-sm text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </div>
      </div>
    </MotionSection>
  );
}
