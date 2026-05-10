"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { Ban, Copy, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  orgInviteAcceptUrl,
  isOrgInvitationExpired,
  orgInvitationStatusBadge,
} from "@/lib/org/invitation-display";
import type { OrgInvitationRow } from "@/lib/query/hooks";

async function copyInviteLink(invitationId: string) {
  const url = orgInviteAcceptUrl(invitationId);
  if (!url) {
    toast.error("Could not build invite link");
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    toast.success("Invite link copied");
  } catch {
    toast.error("Could not copy link");
  }
}

function InvitationActionsCell({
  invitation,
  canEdit,
  onCancelInvitation,
  onResendInvitation,
}: {
  invitation: OrgInvitationRow;
  canEdit: boolean;
  onCancelInvitation: (invitationId: string) => void | Promise<void>;
  onResendInvitation: (invitation: OrgInvitationRow) => void | Promise<void>;
}) {
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  const raw = invitation.status?.toLowerCase() ?? "";
  const isPending = raw === "pending";
  const expired = isPending && isOrgInvitationExpired(invitation);
  const showCopy = isPending && !expired;
  const showResend = canEdit && isPending;
  const showRevoke = canEdit && isPending;

  async function handleResend() {
    setIsResending(true);
    try {
      await onResendInvitation(invitation);
    } finally {
      setIsResending(false);
    }
  }

  return (
    <>
      <div className="flex w-full min-w-0 items-center justify-end gap-0.5">
        {showCopy ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            title="Copy invite link"
            aria-label="Copy invite link"
            onClick={() => void copyInviteLink(invitation.id)}
          >
            <Copy className="size-4" />
          </Button>
        ) : null}
        {showResend ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8"
            title={
              isOrgInvitationExpired(invitation)
                ? "Resend invitation email (refreshes expired invite)"
                : "Resend invitation email"
            }
            aria-label="Resend invitation email"
            disabled={isResending}
            onClick={() => void handleResend()}
          >
            {isResending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </Button>
        ) : null}
        {showRevoke ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="size-8 text-destructive hover:text-destructive"
            title="Revoke invitation"
            aria-label="Revoke invitation"
            onClick={() => setAlertOpen(true)}
          >
            <Ban className="size-4" />
          </Button>
        ) : null}
        {!showCopy && !showResend && !showRevoke ? (
          <span className="pr-1 text-right text-sm text-muted-foreground">—</span>
        ) : null}
      </div>

      <Dialog open={alertOpen} onOpenChange={setAlertOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Revoke invitation</DialogTitle>
            <DialogDescription>
              <span className="block">
                The invite will no longer work for{" "}
                <span className="font-medium text-foreground">{invitation.email}</span>.
              </span>
              <span className="mt-2 block">
                This does not remove people who have already joined.
              </span>
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-start gap-3 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-500" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              This action is permanent and cannot be undone.
            </p>
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setAlertOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                void (async () => {
                  await onCancelInvitation(invitation.id);
                  setAlertOpen(false);
                })()
              }
            >
              Revoke
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type InvitationColumnsOpts = {
  canEdit?: boolean;
  onCancelInvitation: (invitationId: string) => void | Promise<void>;
  onResendInvitation: (invitation: OrgInvitationRow) => void | Promise<void>;
};

export function getOrganizationInvitationColumns({
  canEdit = true,
  onCancelInvitation,
  onResendInvitation,
}: InvitationColumnsOpts): ColumnDef<OrgInvitationRow>[] {
  return [
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) => (
        <p className="truncate font-medium">{row.original.email}</p>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Invited",
      cell: ({ row }) => {
        const date = row.original.createdAt;
        if (!date) return <span className="text-muted-foreground">—</span>;
        const d = new Date(date);
        return (
          <span className="text-sm text-muted-foreground">
            {d.toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </span>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => (
        <span className="text-sm capitalize text-muted-foreground">{row.original.role}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      cell: ({ row }) => {
        const inv = row.original;
        const { label, variant } = orgInvitationStatusBadge(inv);
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      id: "actions",
      header: "",
      meta: {
        className: "w-28 max-w-28 text-right",
      },
      cell: ({ row }) => (
        <InvitationActionsCell
          invitation={row.original}
          canEdit={canEdit}
          onCancelInvitation={onCancelInvitation}
          onResendInvitation={onResendInvitation}
        />
      ),
    },
  ];
}
