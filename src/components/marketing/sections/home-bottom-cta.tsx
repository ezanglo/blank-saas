import { MarketingHomeBottomActions } from "@/components/marketing/marketing-auth-ctas";
import { MotionSection } from "@/components/marketing/motion-section";

/**
 * Dokploy-style closing band: strong headline + two paths (product vs source).
 */
export function HomeBottomCta() {
  return (
    <MotionSection className="px-6 pb-20 pt-12 md:pb-28 md:pt-16">
      <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-gradient-to-b from-muted/60 to-muted/30 px-8 py-14 text-center shadow-sm md:px-12 md:py-16">
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
          Run it locally, then make it yours
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground md:text-lg">
          No sales funnel—clone the repo, copy <code className="rounded bg-background px-1.5 py-0.5 font-mono text-sm">.env.example</code>, and
          iterate. Sign up only if you want to click through the bundled UI.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
          <MarketingHomeBottomActions />
        </div>
      </div>
    </MotionSection>
  );
}
