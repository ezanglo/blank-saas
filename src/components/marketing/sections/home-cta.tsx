import { MarketingHomeCtaSection } from "@/components/marketing/marketing-auth-ctas";
import { MotionSection } from "@/components/marketing/motion-section";

export function HomeCta() {
  return (
    <MotionSection className="px-6 pb-20 pt-4 md:pb-28">
      <MarketingHomeCtaSection />
    </MotionSection>
  );
}
