"use client";

import { useMemo, useCallback } from "react";
import { toast } from "sonner";

import { OrgInviteMemberDialog } from "@/components/org/org-invite-member-dialog";
import { getOrganizationMembersColumns } from "@/components/org/org-members-table-columns";
import { OrgDataTable } from "@/components/ui/org-data-table";
import { removeMemberAction, updateMemberRoleAction } from "@/lib/actions/member";
import type { OrgRole } from "@/lib/auth/rbac";
import { useOrganizationMembers } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

export function OrgMembersPanel({
  org,
  viewerId,
  canManage,
  embedded = false,
  searchText,
}: {
  org: { id: string; slug: string };
  viewerId: string;
  canManage: boolean;
  embedded?: boolean;
  searchText?: string;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useOrganizationMembers(org.id);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.members.list(org.id) });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.invitations.list(org.id),
    });
  }, [org.id, queryClient]);

  const rawRows = data?.members ?? [];
  const q = searchText?.trim().toLowerCase() ?? "";
  const filtered =
    q.length === 0
      ? rawRows
      : rawRows.filter((m) => {
          const hay = `${m.user?.name ?? ""} ${m.user?.email ?? ""}`.trim().toLowerCase();
          return hay.includes(q);
        });

  const viewerRole = rawRows.find((m) => m.userId === viewerId)?.role;

  const columns = useMemo(
    () =>
      getOrganizationMembersColumns({
        currentUserId: viewerId,
        currentUserRole: viewerRole,
        canEdit: canManage,
        onRoleChange: async (memberId, role) => {
          try {
            await updateMemberRoleAction({
              organizationId: org.id,
              memberId,
              role: role as OrgRole,
            });
            toast.success("Role updated");
            await invalidate();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not update role");
          }
        },
        onRemoveMember: async (memberIdOrEmail) => {
          try {
            await removeMemberAction({
              organizationId: org.id,
              memberIdOrEmail,
            });
            toast.success("Member removed");
            await invalidate();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not remove member");
          }
        },
      }),
    [canManage, org.id, viewerId, viewerRole, invalidate],
  );

  const emptyMessage =
    rawRows.length === 0
      ? "No members yet. Invite someone to get started."
      : "No members match your search.";

  return (
    <div className="flex flex-col gap-6">
      {!embedded ? (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold tracking-tight">Members</h2>
            <p className="text-sm text-muted-foreground">
              Manage who has access to this workspace.
            </p>
          </div>
          {canManage ? <OrgInviteMemberDialog orgId={org.id} onDone={invalidate} /> : null}
        </div>
      ) : null}

      <OrgDataTable columns={columns} data={filtered} emptyMessage={emptyMessage} isLoading={isLoading} />
    </div>
  );
}
