"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, ChevronsUpDown, GalleryVerticalEnd, Plus } from "lucide-react";
import { useState } from "react";

import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { CreateOrganizationDialog } from "@/components/org/create-org-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { setActiveOrganizationAction } from "@/lib/actions/organization";
import { activeOrganizationIdFromSession } from "@/lib/org/session-active-org";
import { useOrganizations, useSessionQuery } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";

/** sidebar-07 workspace row, wired to Better Auth organizations. */
export function TeamSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const [pending, setPending] = useState(false);
  const [createOrgOpen, setCreateOrgOpen] = useState(false);

  const { data: sessionRes, isLoading: sessionLoading } = useSessionQuery();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();

  const currentId = activeOrganizationIdFromSession(sessionRes);
  const activeOrg =
    orgs?.find((o) => o.id === currentId) ?? (orgs?.length === 1 ? orgs[0] : undefined);

  const loading = sessionLoading || orgsLoading;

  let primary = "Select workspace";
  let secondary: string | undefined;
  if (loading) {
    primary = "Loading…";
    secondary = undefined;
  } else if (activeOrg) {
    primary = activeOrg.name;
    secondary = `/${activeOrg.slug}`;
  } else if (orgs?.length === 0) {
    primary = "Blank SaaS";
    secondary = "Create workspace";
  } else {
    secondary = orgs?.length ? "Choose workspace" : undefined;
  }

  const Logo = GalleryVerticalEnd;

  async function switchToOrg(orgId: string, slug: string) {
    setPending(true);
    try {
      if (!currentId || orgId !== currentId) {
        await setActiveOrganizationAction({ organizationId: orgId });
      }
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      router.push(`/organizations/${slug}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not switch workspace");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              disabled={pending}
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Logo className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{primary}</span>
                {secondary ? (
                  <span className="truncate text-xs text-muted-foreground">{secondary}</span>
                ) : null}
              </div>
              <ChevronsUpDown className="ml-auto size-4 opacity-70" aria-hidden />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Workspace</DropdownMenuLabel>
            {(orgs ?? []).map((org) => (
              <DropdownMenuItem
                key={org.id}
                className="cursor-pointer gap-2 p-2"
                onClick={() => void switchToOrg(org.id, org.slug)}
              >
                <div className="flex size-6 items-center justify-center rounded-md border bg-background">
                  <Logo className="size-3.5 shrink-0" />
                </div>
                <span className="truncate">{org.name}</span>
                {org.id === currentId ? (
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">Active</span>
                ) : null}
              </DropdownMenuItem>
            ))}
            {(orgs ?? []).length === 0 ? (
              <DropdownMenuItem className="px-3 py-2 text-sm text-muted-foreground" disabled>
                No organizations yet
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="gap-2 p-2">
              <Link href="/organizations" className="cursor-pointer">
                <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                  <Building2 className="size-3.5 shrink-0" />
                </div>
                <span className="font-medium">All organizations</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem
              className="cursor-pointer gap-2 p-2"
              onSelect={() => {
                setCreateOrgOpen(true);
              }}
            >
              <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                <Plus className="size-4" />
              </div>
              <span className="font-medium text-muted-foreground">New organization</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
    <CreateOrganizationDialog open={createOrgOpen} onOpenChange={setCreateOrgOpen} />
  </>
  );
}
