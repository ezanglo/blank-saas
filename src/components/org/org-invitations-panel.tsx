"use client";

import { useMemo, useCallback } from "react";
import { toast } from "sonner";

import { getOrganizationInvitationColumns } from "@/components/org/org-invitations-table-columns";
import { OrgDataTable } from "@/components/ui/org-data-table";
import { cancelInvitationAction, inviteMemberAction } from "@/lib/actions/member";
import type { OrgRole } from "@/lib/auth/rbac";
import { useOrgInvitations } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

function parseInviteRole(role: string): OrgRole {
  const r = role.toLowerCase();
  if (r === "owner" || r === "admin" || r === "member") return r;
  return "member";
}

export function OrgInvitationsPanel({
  org,
  canManage,
  embedded = false,
  searchText,
}: {
  org: { id: string };
  canManage: boolean;
  embedded?: boolean;
  searchText?: string;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useOrgInvitations(org.id);

  const invalidate = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.invitations.list(org.id),
    });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.members.list(org.id),
    });
  }, [org.id, queryClient]);

  const invitations = data ?? [];
  const q = searchText?.trim().toLowerCase() ?? "";
  const filtered =
    q.length === 0
      ? invitations
      : invitations.filter((i) => i.email.toLowerCase().includes(q));

  const columns = useMemo(
    () =>
      getOrganizationInvitationColumns({
        canEdit: canManage,
        onCancelInvitation: async (invitationId) => {
          try {
            await cancelInvitationAction({
              organizationId: org.id,
              invitationId,
            });
            toast.success("Invitation cancelled");
            await invalidate();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Could not cancel invitation");
          }
        },
        onResendInvitation: async (inv) => {
          try {
            await inviteMemberAction({
              organizationId: org.id,
              email: inv.email.trim().toLowerCase(),
              role: parseInviteRole(inv.role),
            });
            toast.success(`Invitation email sent to ${inv.email}`);
            await invalidate();
          } catch (e) {
            toast.error(e instanceof Error ? e.message : "Failed to resend invitation");
          }
        },
      }),
    [canManage, org.id, invalidate],
  );

  const emptyMessage =
    invitations.length === 0 ? "No invitations." : "No invitations match your search.";

  return (
    <div className="flex flex-col gap-6">
      {embedded ? null : (
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Invitations</h2>
          <p className="text-sm text-muted-foreground">
            Invitation history for this organization.
          </p>
        </div>
      )}

      <OrgDataTable columns={columns} data={filtered} emptyMessage={emptyMessage} isLoading={isLoading} />
    </div>
  );
}
