"use client";

import * as React from "react";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

export function routingHeaderTitle(pathname: string | null): string {
  const p = (pathname ?? "/").split("/").filter(Boolean);

  if (p[0] === "invite") return "Invitation";
  if (p[0] === "dashboard") return "Workspace";
  if (p[0] === "account") return "Account Settings";
  if (p[0] === "organizations") {
    if (p.length === 1) return "Organizations";
    if (p.length === 2) return "Overview";
    const leaf = p[2];
    if (leaf === "team") return "Team";
    if (leaf === "members" || leaf === "invitations") return "Team";
    if (leaf === "settings") return "Workspace Settings";
    return "Workspace";
  }
  return "App";
}

export function SiteHeader() {
  const pathname = usePathname();

  const title = React.useMemo(() => routingHeaderTitle(pathname), [pathname]);

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="hidden h-4 self-center shrink-0 md:block"
        />
        <h1 className="truncate text-base font-medium">{title}</h1>
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
