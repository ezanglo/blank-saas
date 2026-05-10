"use client";

import { useRouter } from "next/navigation";
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
import { useOrganizations, useSessionQuery } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

function activeOrgId(
  data:
    | {
        session?: { activeOrganizationId?: string | null; activeOrganization?: string | null };
      }
    | null
    | undefined,
): string | null {
  const inner = data?.session;
  if (!inner) return null;
  return inner.activeOrganizationId ?? inner.activeOrganization ?? null;
}

export function OrgSwitcher() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: sessionRes, isLoading: sessionLoading } = useSessionQuery();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const [pending, setPending] = useState(false);

  const currentId = activeOrgId(sessionRes);
  const current =
    orgs?.find((o) => o.id === currentId) ?? (orgs?.length === 1 ? orgs[0] : undefined);

  const label = current?.name ?? (orgsLoading || sessionLoading ? "Loading…" : "Select workspace");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-[14rem] justify-between gap-2" disabled={pending}>
          <span className="truncate">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {(orgs ?? []).map((org) => (
          <DropdownMenuItem
            key={org.id}
            className="cursor-pointer"
            onClick={async () => {
              setPending(true);
              try {
                if (!currentId || org.id !== currentId) {
                  await setActiveOrganizationAction({ organizationId: org.id });
                }
                await queryClient.invalidateQueries({ queryKey: queryKeys.session });
                await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
                router.push(`/organizations/${org.slug}`);
              } catch (e) {
                toast.error(e instanceof Error ? e.message : "Could not switch workspace");
              } finally {
                setPending(false);
              }
            }}
          >
            <span className="truncate">{org.name}</span>
            {org.id === currentId ? (
              <span className="ml-auto text-xs text-muted-foreground">Active</span>
            ) : null}
          </DropdownMenuItem>
        ))}
        {orgs?.length === 0 ? (
          <div className="px-2 py-1.5 text-sm text-muted-foreground">No organizations yet</div>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
