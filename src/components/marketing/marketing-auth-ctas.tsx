"use client";

import Link from "next/link";

import { GitHubMark } from "@/components/icons/github-mark";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { useSessionQuery } from "@/lib/query/hooks";
import { PUBLIC_GITHUB_REPO_URL } from "@/lib/marketing/public-repo";

function useMarketingSignedIn(): { signedIn: boolean; isLoading: boolean } {
  const { data, isLoading } = useSessionQuery();
  return { signedIn: Boolean(data?.user), isLoading };
}

/** GitHub repo link (icon) — shared by marketing header. */
export function MarketingNavGithubButton() {
  return (
    <Button variant="outline" size="icon-sm" className="shrink-0" asChild>
      <Link
        href={PUBLIC_GITHUB_REPO_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="View source on GitHub"
      >
        <GitHubMark className="size-4" />
      </Link>
    </Button>
  );
}

/**
 * Nav bar header CTAs: theme toggle, GitHub, Sign in (or Dashboard).
 * Sign up stays in the mobile sheet and other entry points, not in this strip.
 */
export function MarketingNavAuthButtons() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <ThemeToggle />
      <MarketingNavGithubButton />
      {isLoading ? (
        <Button variant="ghost" size="sm" className="inline-flex" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      ) : signedIn ? (
        <Button size="sm" className="inline-flex" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      ) : (
        <Button variant="ghost" size="sm" className="inline-flex" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
      )}
    </div>
  );
}

/** Mobile sheet footer auth actions (theme + GitHub live in the sticky header). */
export function MarketingNavAuthButtonsMobile() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  if (isLoading) {
    return (
      <div className="mt-auto flex flex-col gap-2 border-t pt-6">
        <Button variant="outline" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="mt-auto flex flex-col gap-2 border-t pt-6">
        <Button asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-auto flex flex-col gap-2 border-t pt-6">
      <Button variant="outline" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button asChild>
        <Link href="/sign-up">Sign up</Link>
      </Button>
    </div>
  );
}

export function MarketingHeroActions() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  if (isLoading) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/sign-up">Sign up</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/features">Features</Link>
        </Button>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/features">Features</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button size="lg" asChild>
        <Link href="/sign-up">Sign up</Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="/features">Features</Link>
      </Button>
    </div>
  );
}

/** Bottom CTA strip: primary app action + GitHub (Dokploy-style dual path). */
export function MarketingHomeBottomActions() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  const githubButton = (
    <Button size="lg" variant="outline" asChild>
      <Link href={PUBLIC_GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
        GitHub
      </Link>
    </Button>
  );

  if (isLoading) {
    return (
      <>
        <Button size="lg" asChild>
          <Link href="/sign-up">Sign up</Link>
        </Button>
        {githubButton}
      </>
    );
  }

  if (signedIn) {
    return (
      <>
        <Button size="lg" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
        {githubButton}
      </>
    );
  }

  return (
    <>
      <Button size="lg" asChild>
        <Link href="/sign-up">Sign up</Link>
      </Button>
      {githubButton}
    </>
  );
}
