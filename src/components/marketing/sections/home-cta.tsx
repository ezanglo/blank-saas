import Link from "next/link";

import { MotionSection } from "@/components/marketing/motion-section";
import { Button } from "@/components/ui/button";

export function HomeCta() {
  return (
    <MotionSection className="px-6 pb-20 pt-4 md:pb-28">
      <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border bg-card px-8 py-12 text-center shadow-sm">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Ready to build your tenant model?
        </h2>
        <p className="mt-3 text-muted-foreground">
          Create an account and open the dashboard stub in one flow.
        </p>
        <Button size="lg" className="mt-8" asChild>
          <Link href="/sign-up">Get started free</Link>
        </Button>
      </div>
    </MotionSection>
  );
}
