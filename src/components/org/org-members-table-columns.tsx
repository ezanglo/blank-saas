"use client";

import * as React from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { UserMinus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { OrganizationMemberRow } from "@/lib/query/hooks";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "member", label: "Member" },
] as const;

function initials(name?: string | null, email?: string | null) {
  if (name) {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (email) return email.slice(0, 2).toUpperCase();
  return "?";
}

function MemberRemoveCell({
  member,
  disabled,
  onRemove,
}: {
  member: OrganizationMemberRow;
  disabled: boolean;
  onRemove: (memberIdOrEmail: string) => void | Promise<void>;
}) {
  const [open, setOpen] = React.useState(false);

  if (disabled) {
    return <span className="pr-1 text-right text-sm text-muted-foreground">—</span>;
  }

  return (
    <>
      <div className="flex w-full min-w-0 items-center justify-end gap-0.5">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="size-8 text-destructive hover:text-destructive"
          title="Remove member"
          aria-label="Remove member"
          onClick={() => setOpen(true)}
        >
          <UserMinus className="size-4" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove member</DialogTitle>
            <DialogDescription>
              <span className="block">They&apos;ll lose access to this workspace right away.</span>
              <span className="mt-2 block">
                Remove{" "}
                <span className="font-medium text-foreground">
                  {member.user?.name ?? member.user?.email ?? "this member"}
                </span>{" "}
                from this organization?
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                void (async () => {
                  await onRemove(member.user?.email ?? member.id);
                  setOpen(false);
                })()
              }
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

type MembersColumnsOpts = {
  currentUserId?: string | null;
  currentUserRole?: string;
  canEdit?: boolean;
  onRoleChange: (memberId: string, role: string) => void | Promise<void>;
  onRemoveMember: (memberIdOrEmail: string) => void | Promise<void>;
};

export function getOrganizationMembersColumns({
  currentUserId,
  currentUserRole,
  canEdit = true,
  onRoleChange,
  onRemoveMember,
}: MembersColumnsOpts): ColumnDef<OrganizationMemberRow>[] {
  return [
    {
      accessorKey: "user",
      header: "Member",
      cell: ({ row }) => {
        const member = row.original;
        const uid = member.user?.id ?? member.userId;
        const isSelf = Boolean(currentUserId && uid === currentUserId);

        return (
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarImage src={member.user?.image ?? undefined} alt="" />
              <AvatarFallback>
                {initials(member.user?.name, member.user?.email ?? null)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-0.5">
              <div className="flex min-w-0 items-center gap-2">
                <p className="truncate font-medium">
                  {member.user?.name ?? member.user?.email ?? member.userId ?? "Unknown"}
                </p>
                {isSelf ? (
                  <Badge variant="secondary" className="shrink-0">
                    You
                  </Badge>
                ) : null}
              </div>
              {member.user?.name && member.user?.email ? (
                <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
              ) : null}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
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
      cell: ({ row }) => {
        const member = row.original;
        const isOwner = member.role === "owner";
        const cannotAssignOwner = currentUserRole === "owner";

        if (!canEdit) {
          const label =
            ROLE_OPTIONS.find((o) => o.value === member.role)?.label ?? member.role;
          return <span className="text-sm capitalize text-muted-foreground">{label}</span>;
        }

        return (
          <Select
            value={member.role}
            onValueChange={(value) => void onRoleChange(member.id, value)}
            disabled={isOwner}
          >
            <SelectTrigger size="sm" className="h-8 w-[110px] border-muted bg-muted/50">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_OPTIONS.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  disabled={
                    (isOwner && opt.value !== "owner") ||
                    (cannotAssignOwner && opt.value === "owner")
                  }
                >
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      },
    },
    ...(canEdit
      ? ([
          {
            id: "actions",
            header: "",
            meta: {
              className: "w-28 max-w-28 text-right",
            },
            cell: ({ row }: { row: { original: OrganizationMemberRow } }) => (
              <MemberRemoveCell
                member={row.original}
                disabled={row.original.role === "owner"}
                onRemove={onRemoveMember}
              />
            ),
          },
        ] as ColumnDef<OrganizationMemberRow>[])
      : []),
  ];
}
