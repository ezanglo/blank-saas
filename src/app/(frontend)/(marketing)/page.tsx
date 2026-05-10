import type { Metadata } from "next";

import { HomeCta } from "@/components/marketing/sections/home-cta";
import { HomeFaq } from "@/components/marketing/sections/home-faq";
import { HomeFeatures } from "@/components/marketing/sections/home-features";
import { HomeHero } from "@/components/marketing/sections/home-hero";
import { HomeHowItWorks } from "@/components/marketing/sections/home-how-it-works";
import { HomeLogoBar } from "@/components/marketing/sections/home-logo-bar";
import { HomePricingPreview } from "@/components/marketing/sections/home-pricing-preview";
import { HomeTestimonials } from "@/components/marketing/sections/home-testimonials";
import { getMarketingPriceDisplays } from "@/lib/billing/marketing-prices";

export const metadata: Metadata = {
  title: "Blank SaaS — Multi-tenant starter",
  description:
    "Organizations, auth, quotas, and Payload CMS—multi-tenant foundations for B2B SaaS.",
  openGraph: {
    title: "Blank SaaS — Multi-tenant starter",
    description:
      "Organizations, auth, quotas, and Payload CMS—multi-tenant foundations for B2B SaaS.",
  },
};

export default async function MarketingHomePage() {
  const prices = await getMarketingPriceDisplays();
  return (
    <main>
      <HomeHero />
      <HomeLogoBar />
      <HomeFeatures />
      <HomeHowItWorks />
      <HomePricingPreview prices={prices} />
      <HomeTestimonials />
      <HomeFaq />
      <HomeCta />
    </main>
  );
}
