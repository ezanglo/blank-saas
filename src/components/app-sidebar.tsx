"use client";

import * as React from "react";
import { Building2, LayoutDashboard, Settings, Users } from "lucide-react";

import { NavMain, type NavMainItem } from "@/components/nav-main";
import type { NavSecondaryItem } from "@/components/nav-secondary";
import { NavSecondary } from "@/components/nav-secondary";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import { useActiveOrganization } from "@/lib/query/hooks";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";

type AppSidebarProps = React.ComponentProps<typeof Sidebar> & {
  user: { name: string | null; email: string; image?: string | null };
};

/** Sidebar scoped to the active organization; header switcher chooses which org. */
export function AppSidebar({ user, ...props }: AppSidebarProps) {
  const { slug, isLoading } = useActiveOrganization();
  const pickerHref = "/organizations";
  const base = slug ? `/organizations/${slug}` : pickerHref;

  const menuNav: NavMainItem[] = slug
    ? [{ title: "Dashboard", url: base, icon: LayoutDashboard }]
    : [
        {
          title: isLoading ? "Loading…" : "Choose workspace",
          url: pickerHref,
          icon: Building2,
        },
      ];

  const bottomNav: NavSecondaryItem[] = slug
    ? [
        { title: "Team", url: `${base}/team`, icon: Users },
        { title: "Settings", url: `${base}/settings`, icon: Settings },
      ]
    : [];

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={menuNav} groupLabel="Menu" />
        {bottomNav.length > 0 ? (
          <NavSecondary items={bottomNav} className="mt-auto shrink-0" />
        ) : null}
      </SidebarContent>
      <SidebarFooter className="shrink-0">
        <NavUser
          user={{
            name: user.name,
            email: user.email,
            image: user.image ?? undefined,
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
