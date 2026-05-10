"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

import { OrgSwitcher } from "./org-switcher";
import { UserMenu } from "./user-menu";

const mainNav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/organizations", label: "Organizations" },
  { href: "/account", label: "Account" },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: { name: string | null; email: string; image?: string | null };
  children: ReactNode;
}) {
  const pathname = usePathname();
  const minimalChrome = pathname?.startsWith("/invite") ?? false;

  if (minimalChrome) {
    return (
      <div className="min-h-screen bg-muted/20">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-6">
            <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
              Blank SaaS
            </Link>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <UserMenu user={user} />
            </div>
          </div>
        </header>
        <div className="mx-auto w-full max-w-6xl px-6 py-8">{children}</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/20">
      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4">
          <Link href="/dashboard" className="text-sm font-semibold tracking-tight">
            Blank SaaS
          </Link>
        </div>
        <nav className="flex flex-col gap-1 p-3">
          {mainNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm transition-colors",
                pathname === item.href || pathname?.startsWith(`${item.href}/`)
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t p-3">
          <ThemeToggle />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-6">
          <div className="flex min-w-0 flex-1 items-center gap-2 md:gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex w-56 flex-col gap-4 pt-10">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <nav className="flex flex-col gap-1">
                  {mainNav.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-md px-3 py-2 text-sm transition-colors",
                        pathname === item.href || pathname?.startsWith(`${item.href}/`)
                          ? "bg-muted font-medium text-foreground"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                      )}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <ThemeToggle />
              </SheetContent>
            </Sheet>
            <OrgSwitcher />
          </div>
          <UserMenu user={user} />
        </header>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
