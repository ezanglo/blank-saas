"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";

const SETTINGS_SECTION_LABELS: Record<string, string> = {
  general: "General",
  team: "Team",
  usage: "Usage",
  "audit-logs": "Audit logs",
  webhooks: "Webhooks",
};

function formatWorkspaceLabel(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function sectionLabel(sectionKey: string) {
  return (
    SETTINGS_SECTION_LABELS[sectionKey] ??
    sectionKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

type Crumb = { label: string; href?: string };

function breadcrumbsForPath(pathname: string | null): Crumb[] | null {
  const p = (pathname ?? "/").split("/").filter(Boolean);
  if (p.length === 0) return null;

  if (p[0] === "invite" && p[1]) {
    return [{ label: "Invitation" }];
  }

  if (p[0] === "account") {
    return [{ label: "Account" }];
  }

  if (p[0] === "dashboard") {
    return [{ label: "Workspace" }];
  }

  if (p[0] === "organizations") {
    if (p.length === 1) {
      return [{ label: "Organizations" }];
    }

    const orgSlug = p[1];
    const workspace = formatWorkspaceLabel(orgSlug);
    const base: Crumb[] = [{ label: "Organizations", href: "/organizations" }];

    if (p.length === 2) {
      return [...base, { label: workspace }];
    }

    if (p[2] === "settings") {
      const leaf = p[3] ?? "general";
      return [
        ...base,
        { label: workspace, href: `/organizations/${orgSlug}` },
        { label: "Settings", href: `/organizations/${orgSlug}/settings/general` },
        { label: sectionLabel(leaf) },
      ];
    }

    return [...base, { label: workspace }];
  }

  return null;
}

export function routingHeaderTitle(pathname: string | null): string {
  const p = (pathname ?? "/").split("/").filter(Boolean);

  if (p[0] === "invite") return "Invitation";
  if (p[0] === "dashboard") return "Workspace";
  if (p[0] === "account") return "Account Settings";
  if (p[0] === "organizations") {
    if (p.length === 1) return "Organizations";
    if (p.length === 2) return "Overview";
    if (p[2] === "settings") {
      const leaf = p[3] ?? "general";
      return `Organization Settings · ${sectionLabel(leaf)}`;
    }
    return "Workspace";
  }
  return "App";
}

function HeaderBreadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <Breadcrumb className="min-w-0">
      <BreadcrumbList>
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <React.Fragment key={`${item.label}-${i}`}>
              {i > 0 ? <BreadcrumbSeparator /> : null}
              <BreadcrumbItem className="min-w-0">
                {isLast || !item.href ? (
                  <BreadcrumbPage className="truncate">{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href} className="truncate">
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}

export function SiteHeader() {
  const pathname = usePathname();

  const title = React.useMemo(() => routingHeaderTitle(pathname), [pathname]);
  const crumbs = React.useMemo(() => breadcrumbsForPath(pathname), [pathname]);

  return (
    <header className="flex h-[var(--header-height)] shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-[var(--header-height)]">
      <div className="flex w-full min-w-0 items-center gap-2 px-4 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="hidden h-4 self-center shrink-0 md:block"
        />
        {crumbs?.length ? (
          <HeaderBreadcrumbs items={crumbs} />
        ) : (
          <h1 className="truncate text-base font-medium">{title}</h1>
        )}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
