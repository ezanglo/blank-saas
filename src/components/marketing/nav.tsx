"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
] as const;

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        setScrolled(!e?.isIntersecting);
      },
      { rootMargin: "0px", threshold: 1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <>
      <div ref={sentinelRef} className="pointer-events-none h-px w-full" aria-hidden />
      <header
        className={cn(
          "sticky top-0 z-50 w-full transition-colors",
          scrolled && "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        )}
      >
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground"
          >
            Blank SaaS
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
            <Button size="sm" className="hidden sm:inline-flex" asChild>
              <Link href="/sign-up">Get started</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="size-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="flex flex-col gap-6 pt-10">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-lg font-medium"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="mt-auto flex flex-col gap-2 border-t pt-6">
                  <Button variant="outline" asChild>
                    <Link href="/sign-in">Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/sign-up">Get started</Link>
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
