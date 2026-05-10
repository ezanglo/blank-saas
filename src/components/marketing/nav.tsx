"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  MarketingNavAuthButtons,
  MarketingNavAuthButtonsMobile,
} from "@/components/marketing/marketing-auth-ctas";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const links = [
  { href: "/features", label: "Features" },
  { href: "/#stack", label: "Stack" },
  { href: "/pricing", label: "Pricing" },
  { href: "/blog", label: "Blog" },
  { href: "/changelog", label: "Changelog" },
  { href: "/contact", label: "Contact" },
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
            <MarketingNavAuthButtons />
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
                <MarketingNavAuthButtonsMobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
    </>
  );
}
