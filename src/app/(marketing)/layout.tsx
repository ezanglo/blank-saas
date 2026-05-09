import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-6xl justify-end px-6 pt-6">
        <ThemeToggle />
      </div>
      {children}
    </main>
  );
}
