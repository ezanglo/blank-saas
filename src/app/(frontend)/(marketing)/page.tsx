import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function MarketingHomePage() {
  return (
    <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-6 px-6 py-20 text-center">
      <p className="text-sm font-medium text-muted-foreground">Phase 1 complete</p>
      <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
        Multi-tenant starter scaffolded
      </h1>
      <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
        Route groups, design tokens, and core UI providers are in place so the next
        phases can focus on product features.
      </p>
      <Button asChild>
        <Link href="/dashboard">Open dashboard stub</Link>
      </Button>
    </section>
  );
}
