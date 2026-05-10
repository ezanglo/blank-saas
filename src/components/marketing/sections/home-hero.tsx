import { MarketingHeroActions } from "@/components/marketing/marketing-auth-ctas";
import { MotionSection } from "@/components/marketing/motion-section";

export function HomeHero() {
  return (
    <MotionSection className="relative overflow-hidden px-6 pb-16 pt-12 md:pb-24 md:pt-16">
      <div
        className="pointer-events-none absolute inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -20%, hsl(var(--primary) / 0.15), transparent)",
        }}
      />
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Built for teams shipping B2B SaaS
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
          Multi-tenant foundations without the integration maze
        </h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
          Organizations, auth, quotas, and Payload CMS—wired so you can focus on
          your product instead of plumbing.
        </p>
        <MarketingHeroActions />
      </div>
    </MotionSection>
  );
}
