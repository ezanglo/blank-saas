"use client";

import { Search, UserPlus } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { OrgInviteMemberDialog } from "@/components/org/org-invite-member-dialog";
import { OrgInvitationsPanel } from "@/components/org/org-invitations-panel";
import { OrgMembersPanel } from "@/components/org/org-members-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOrganizationMembers, useOrgInvitations } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

function tabFromSearchParams(tab: string | null) {
  if (tab === "invites" || tab === "invitations") return "invites" as const;
  return "members" as const;
}

export function OrgTeamContent({
  org,
  viewerId,
  canManage,
}: {
  org: { id: string; slug: string };
  viewerId: string;
  canManage: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const activeTab = tabFromSearchParams(searchParams.get("tab"));

  function setTab(next: "members" | "invites") {
    const p = new URLSearchParams(searchParams.toString());
    if (next === "invites") p.set("tab", "invites");
    else p.delete("tab");
    const qs = p.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }

  const [inviteOpen, setInviteOpen] = useState(false);
  const [searchText, setSearchText] = useState("");

  const { data: membersData } = useOrganizationMembers(org.id);
  const { data: invitationsData } = useOrgInvitations(org.id);

  const memberCount = membersData?.total ?? membersData?.members?.length ?? 0;
  const invitations = invitationsData ?? [];
  const inviteCount = invitations.length;

  async function invalidateTeamQueries() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.members.list(org.id) });
    await queryClient.invalidateQueries({ queryKey: queryKeys.invitations.list(org.id) });
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          {canManage ? (
            <>
              <Button size="sm" className="shrink-0 gap-2" onClick={() => setInviteOpen(true)}>
                <UserPlus className="size-4" />
                Invite
              </Button>
              <OrgInviteMemberDialog
                orgId={org.id}
                open={inviteOpen}
                onOpenChange={setInviteOpen}
                onDone={invalidateTeamQueries}
              />
            </>
          ) : null}
        </div>
        <p className="text-sm text-muted-foreground">
          Manage who has access to your organization.
        </p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => setTab(v as "members" | "invites")}
        className="w-full space-y-4"
      >
        <div className="space-y-4">
          <div className="w-full border-b border-border pb-[5px]">
            <TabsList variant="line" className="h-auto w-fit justify-start gap-6 bg-transparent p-0">
              <TabsTrigger value="members" className="gap-1.5 px-0 pb-2 pt-0">
                Members
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 font-normal">
                  {memberCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="invites" className="gap-1.5 px-0 pb-2 pt-0">
                Invites
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 font-normal">
                  {inviteCount}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="relative max-w-sm">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <Input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search..."
              aria-label={activeTab === "members" ? "Search members" : "Search invitations"}
              className="ps-9"
            />
          </div>
        </div>

        <TabsContent value="members" className="mt-0 outline-none">
          <OrgMembersPanel
            org={org}
            viewerId={viewerId}
            canManage={canManage}
            embedded
            searchText={searchText}
          />
        </TabsContent>
        <TabsContent value="invites" className="mt-0 outline-none">
          <OrgInvitationsPanel
            org={org}
            canManage={canManage}
            embedded
            searchText={searchText}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
