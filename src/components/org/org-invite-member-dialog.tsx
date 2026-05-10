"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { inviteMemberAction } from "@/lib/actions/member";

export function OrgInviteMemberDialog({
  orgId,
  onDone,
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  orgId: string;
  onDone: () => Promise<void>;
  trigger?: React.ReactNode;
  /** Controlled — omit trigger to open from a parent button. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled =
    openProp !== undefined && onOpenChangeProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const setOpen = controlled ? onOpenChangeProp : setInternalOpen;

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
      {controlled ? (
        trigger ? (
          <DialogTrigger asChild>{trigger}</DialogTrigger>
        ) : null
      ) : (
        <DialogTrigger asChild>
          {trigger ?? <Button size="sm">Invite member</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite member</DialogTitle>
          <DialogDescription>
            Send an invitation by email. They&apos;ll accept from the link and join this workspace.
          </DialogDescription>
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
