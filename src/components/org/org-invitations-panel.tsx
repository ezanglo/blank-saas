"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cancelInvitationAction } from "@/lib/actions/member";
import { useOrgInvitations } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function OrgInvitationsPanel({
  org,
  canManage,
}: {
  org: { id: string };
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useOrgInvitations(org.id);

  async function invalidate() {
    await queryClient.invalidateQueries({
      queryKey: queryKeys.invitations.list(org.id),
    });
  }

  const pending = (data ?? []).filter((i) => i.status === "pending");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Invitations</h1>
        <p className="text-sm text-muted-foreground">Pending invitations for this organization.</p>
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              {canManage ? <TableHead className="w-[140px] text-end">Actions</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            ) : pending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="text-muted-foreground">
                  No pending invitations.
                </TableCell>
              </TableRow>
            ) : (
              pending.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell>{inv.email}</TableCell>
                  <TableCell className="capitalize">{inv.role}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{inv.status}</Badge>
                  </TableCell>
                  {canManage ? (
                    <TableCell className="text-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          const ok = confirm(`Cancel invitation to ${inv.email}?`);
                          if (!ok) return;
                          try {
                            await cancelInvitationAction({
                              organizationId: org.id,
                              invitationId: inv.id,
                            });
                            toast.success("Invitation canceled");
                            await invalidate();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Could not cancel");
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
