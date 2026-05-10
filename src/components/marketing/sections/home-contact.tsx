import Link from "next/link";

import { MotionSection } from "@/components/marketing/motion-section";
import { Button } from "@/components/ui/button";
import { PUBLIC_GITHUB_REPO_URL } from "@/lib/marketing/public-repo";

const issuesUrl = `${PUBLIC_GITHUB_REPO_URL}/issues`;

/**
 * Lightweight strip before the closing CTA: contact + GitHub issues.
 */
export function HomeContact() {
  return (
    <MotionSection className="border-t bg-muted/20 px-6 py-14 md:py-20">
      <div className="mx-auto flex max-w-4xl flex-col gap-6 text-center md:flex-row md:items-center md:justify-between md:text-left">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">Questions or feedback?</h2>
          <p className="text-muted-foreground">
            Public bugs and ideas belong on{" "}
            <Link
              href={issuesUrl}
              className="font-medium text-foreground underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </Link>
            . For private messages, use the contact form.
          </p>
        </div>
        <Button asChild variant="outline" className="shrink-0 self-center md:self-auto">
          <Link href="/contact">Contact</Link>
        </Button>
      </div>
    </MotionSection>
  );
}
