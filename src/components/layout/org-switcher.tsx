"use client";

import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setActiveOrganizationAction } from "@/lib/actions/organization";
import { useAnalytics } from "@/hooks/use-analytics";
import { activeOrganizationIdFromSession } from "@/lib/org/session-active-org";
import { useOrganizations, useSessionQuery } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

/** Compact workspace control for layouts without sidebar (e.g. invite chrome). */
export function OrgSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: sessionRes, isLoading: sessionLoading } = useSessionQuery();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const { group } = useAnalytics();
  const [pending, setPending] = useState(false);

  const currentId = activeOrganizationIdFromSession(sessionRes);
  const current =
    orgs?.find((o) => o.id === currentId) ?? (orgs?.length === 1 ? orgs[0] : undefined);

  const label = current?.name ?? (orgsLoading || sessionLoading ? "Loading…" : "Select workspace");

  async function switchToOrg(orgId: string, slug: string, orgName: string) {
    setPending(true);
    try {
      if (!currentId || orgId !== currentId) {
        await setActiveOrganizationAction({ organizationId: orgId });
      }
      group("company", orgId, { name: orgName });
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="max-w-[14rem] cursor-pointer justify-between gap-2 font-normal disabled:opacity-50"
          disabled={pending}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(orgs ?? []).map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="cursor-pointer"
            onClick={() => void switchToOrg(org.id, org.slug, org.name)}
          >
            <span className="truncate">{org.name}</span>
            {org.id === currentId ? (
              <span className="ml-auto text-xs text-muted-foreground">Active</span>
            ) : null}
          </DropdownMenuItem>
        ))}
        {(orgs ?? []).length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No organizations yet</div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
