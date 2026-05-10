"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { AppSidebar } from "@/components/app-sidebar";
import { OrgSwitcher } from "@/components/layout/org-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type DashboardShellProps = {
  user: { name: string | null; email: string; image?: string | null };
  children: ReactNode;
};

/**
 * dashboard-01 layout with invite/minimal chrome (same pathname rule as {@link AppShell}).
 */
export function DashboardShell({ user, children }: DashboardShellProps) {
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
              <OrgSwitcher />
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
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" user={user} />
      <SidebarInset className="@container/header">
        <SiteHeader />
        <main className="flex flex-1 flex-col gap-6 overflow-auto p-4 pt-5 md:p-6 md:pt-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
