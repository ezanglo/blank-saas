"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useSessionQuery } from "@/lib/query/hooks";

function useMarketingSignedIn(): { signedIn: boolean; isLoading: boolean } {
  const { data, isLoading } = useSessionQuery();
  return { signedIn: Boolean(data?.user), isLoading };
}

/** Nav bar: sign in / get started, or dashboard when session exists. */
export function MarketingNavAuthButtons() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button size="sm" className="hidden sm:inline-flex" asChild>
          <Link href="/sign-up">Get started</Link>
        </Button>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="flex items-center gap-2">
        <Button size="sm" className="hidden sm:inline-flex" asChild>
          <Link href="/dashboard">Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
        <Link href="/sign-in">Sign in</Link>
      </Button>
      <Button size="sm" className="hidden sm:inline-flex" asChild>
        <Link href="/sign-up">Get started</Link>
      </Button>
    </div>
  );
}

/** Mobile sheet footer auth actions. */
export function MarketingNavAuthButtonsMobile() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  if (isLoading) {
    return (
      <div className="mt-auto flex flex-col gap-2 border-t pt-6">
        <Button variant="outline" asChild>
          <Link href="/sign-in">Sign in</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-up">Get started</Link>
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
        <Link href="/sign-up">Get started</Link>
      </Button>
    </div>
  );
}

export function MarketingHeroActions() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  if (isLoading) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/sign-up">Get started</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="#features">View demo</Link>
        </Button>
      </div>
    );
  }

  if (signedIn) {
    return (
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="#features">View demo</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <Button size="lg" asChild>
        <Link href="/sign-up">Get started</Link>
      </Button>
      <Button size="lg" variant="outline" asChild>
        <Link href="#features">View demo</Link>
      </Button>
    </div>
  );
}

export function MarketingHomeCtaSection() {
  const { signedIn, isLoading } = useMarketingSignedIn();

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center rounded-2xl border bg-card px-8 py-12 text-center shadow-sm">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {signedIn && !isLoading ? "Welcome back" : "Ready to build your tenant model?"}
      </h2>
      <p className="mt-3 text-muted-foreground">
        {signedIn && !isLoading
          ? "Open your dashboard to pick up where you left off."
          : "Create an account and open the dashboard stub in one flow."}
      </p>
      {isLoading ? (
        <Button size="lg" className="mt-8" asChild>
          <Link href="/sign-up">Get started free</Link>
        </Button>
      ) : signedIn ? (
        <Button size="lg" className="mt-8" asChild>
          <Link href="/dashboard">Go to dashboard</Link>
        </Button>
      ) : (
        <Button size="lg" className="mt-8" asChild>
          <Link href="/sign-up">Get started free</Link>
        </Button>
      )}
    </div>
  );
}
