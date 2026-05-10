"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  inviteMemberAction,
  removeMemberAction,
  updateMemberRoleAction,
} from "@/lib/actions/member";
import type { OrgRole } from "@/lib/auth/rbac";
import { useOrganizationMembers } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

const inviteRoles = ["member", "admin", "owner"] as const;

export function OrgMembersPanel({
  org,
  viewerId,
  canManage,
}: {
  org: { id: string; slug: string };
  viewerId: string;
  canManage: boolean;
}) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useOrganizationMembers(org.id);
  const rows = data?.members ?? [];

  async function invalidate() {
    await queryClient.invalidateQueries({ queryKey: queryKeys.members.list(org.id) });
    await queryClient.invalidateQueries({
      queryKey: queryKeys.invitations.list(org.id),
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">People who can access this organization.</p>
        </div>
        {canManage ? <InviteMemberDialog orgId={org.id} onDone={invalidate} /> : null}
      </div>

      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              {canManage ? <TableHead className="w-[120px]" /> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 3 : 2} className="text-muted-foreground">
                  Loading members…
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 3 : 2} className="text-muted-foreground">
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((m) => {
                const email = m.user?.email ?? m.userId;
                const isSelf = m.userId === viewerId;
                return (
                  <TableRow key={m.id}>
                    <TableCell>{email}</TableCell>
                    <TableCell className="capitalize">{m.role}</TableCell>
                    {canManage ? (
                      <TableCell className="text-end">
                        {isSelf ? (
                          <span className="text-xs text-muted-foreground">You</span>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                Actions
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={async () => {
                                  try {
                                    await removeMemberAction({
                                      organizationId: org.id,
                                      memberIdOrEmail: m.id,
                                    });
                                    toast.success("Member removed");
                                    await invalidate();
                                  } catch (e) {
                                    toast.error(
                                      e instanceof Error ? e.message : "Could not remove member",
                                    );
                                  }
                                }}
                              >
                                Remove
                              </DropdownMenuItem>
                              {inviteRoles.map((r) =>
                                r === m.role ? null : (
                                  <DropdownMenuItem
                                    key={r}
                                    onClick={async () => {
                                      try {
                                        await updateMemberRoleAction({
                                          organizationId: org.id,
                                          memberId: m.id,
                                          role: r as OrgRole,
                                        });
                                        toast.success(`Role updated to ${r}`);
                                        await invalidate();
                                      } catch (e) {
                                        toast.error(
                                          e instanceof Error
                                            ? e.message
                                            : "Could not update role",
                                        );
                                      }
                                    }}
                                  >
                                    Set role: {r}
                                  </DropdownMenuItem>
                                ),
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function InviteMemberDialog({ orgId, onDone }: { orgId: string; onDone: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [pending, setPending] = useState(false);

  async function submit() {
    const e = email.trim().toLowerCase();
    if (!e) {
      toast.error("Enter an email address");
      return;
    }
    setPending(true);
    try {
      await inviteMemberAction({ organizationId: orgId, email: e, role });
      toast.success("Invitation sent");
      setEmail("");
      setRole("member");
      setOpen(false);
      await onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not invite");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Invite member</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Email</span>
            <Input
              type="email"
              autoComplete="off"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              placeholder="teammate@example.com"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm font-medium">Role</span>
            <Select value={role} onValueChange={(v) => setRole(v as "member" | "admin")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">Member</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </label>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={() => void submit()}>
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
