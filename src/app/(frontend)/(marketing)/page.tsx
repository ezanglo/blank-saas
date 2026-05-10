import type { Metadata } from "next";

import { HomeBottomCta } from "@/components/marketing/sections/home-bottom-cta";
import { HomeComprehensive } from "@/components/marketing/sections/home-comprehensive";
import { HomeContact } from "@/components/marketing/sections/home-contact";
import { HomeFaq } from "@/components/marketing/sections/home-faq";
import { HomeFeatures } from "@/components/marketing/sections/home-features";
import { HomeHero } from "@/components/marketing/sections/home-hero";
import { HomeHowItWorks } from "@/components/marketing/sections/home-how-it-works";
import { HomeStatsRow } from "@/components/marketing/sections/home-stats-row";
import { HomeTechStack } from "@/components/marketing/sections/home-tech-stack";

export const metadata: Metadata = {
  title: "Blank SaaS — Open source multi-tenant starter",
  description:
    "Free Next.js + Payload + Better Auth starter: orgs, auth, quotas, Postgres, and a codebase you can fork.",
  openGraph: {
    title: "Blank SaaS — Open source multi-tenant starter",
    description:
      "Free Next.js + Payload + Better Auth starter: orgs, auth, quotas, Postgres, and a codebase you can fork.",
  },
};

export default function MarketingHomePage() {
  return (
    <main className="overflow-x-hidden">
      <HomeHero />
      <HomeFeatures />
      <HomeComprehensive />
      <HomeStatsRow />
      <HomeTechStack />
      <HomeHowItWorks />
      <HomeFaq />
      <HomeContact />
      <HomeBottomCta />
    </main>
  );
}
