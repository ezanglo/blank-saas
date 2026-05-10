import type { ReactNode } from "react";

import { MarketingFooter } from "@/components/marketing/footer";
import { MarketingNav } from "@/components/marketing/nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingNav />
      <div className="flex flex-1 flex-col">{children}</div>
      <div className="mx-auto flex w-full max-w-6xl justify-end px-6 pb-4">
        <ThemeToggle />
      </div>
      <MarketingFooter />
    </div>
  );
}
