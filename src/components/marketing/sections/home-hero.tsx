import Link from "next/link";

import { CloneCommandBar } from "@/components/marketing/clone-command-bar";
import { MarketingHeroActions } from "@/components/marketing/marketing-auth-ctas";
import { MotionSection } from "@/components/marketing/motion-section";

/**
 * Dokploy-style hero: large headline, short pitch, prominent one-line install/clone block, then actions.
 */
export function HomeHero() {
  return (
    <MotionSection className="relative overflow-hidden px-6 pb-16 pt-12 md:pb-20 md:pt-20">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -30%, hsl(var(--primary) / 0.12), transparent 55%)",
        }}
      />
      <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <p className="text-sm font-medium tracking-wide text-muted-foreground">
          Open source · Next.js · Payload · Better Auth
        </p>
        <h1 className="mt-5 max-w-4xl text-balance text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl md:leading-[1.08]">
          Multi-tenant SaaS without the integration maze
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg md:text-xl">
          Fork a working app: organizations, sessions, quotas, Postgres, and an admin CMS—then delete
          what you don&apos;t need and ship your product.
        </p>

        <div className="mt-10 flex w-full justify-center px-0 sm:mt-12">
          <CloneCommandBar variant="hero" />
        </div>

        <div className="mt-8 flex w-full justify-center md:mt-10">
          <MarketingHeroActions />
        </div>

        <p className="mt-8 max-w-lg text-sm text-muted-foreground">
          <Link
            href="/#stack"
            className="font-medium text-foreground underline underline-offset-4 hover:no-underline"
          >
            Dependency stack &amp; rationale
          </Link>{" "}
          — how each major package is used in this repo.
        </p>
      </div>
    </MotionSection>
  );
}
