"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { grantPermissionAction } from "@/lib/actions/permissions";
import {
  KNOWN_RESOURCE_TYPE_OPTIONS,
  RESOURCE_ACTIONS,
  type KnownResourceType,
} from "@/lib/permissions/types";
import { useOrganizationMembers } from "@/lib/query/hooks";

const ORG_ROLES = ["owner", "admin", "member"] as const;

export function GrantPermissionDialog({
  organizationId,
  orgSlug,
  onDone,
  trigger,
}: {
  organizationId: string;
  orgSlug: string;
  onDone: () => Promise<void>;
  trigger?: React.ReactNode;
}) {
  const { data: membersData } = useOrganizationMembers(organizationId);
  const members = membersData?.members ?? [];

  const [open, setOpen] = useState(false);
  const [subjectKind, setSubjectKind] = useState<"user" | "org_role">("user");
  const [userSubjectId, setUserSubjectId] = useState("");
  const [roleSubjectId, setRoleSubjectId] = useState<string>("member");
  const [resourcePreset, setResourcePreset] = useState<KnownResourceType | "custom">("project");
  const [customResourceType, setCustomResourceType] = useState("");
  const [customActionsText, setCustomActionsText] = useState("");
  const [resourceId, setResourceId] = useState("");
  const [expiry, setExpiry] = useState("");
  const [selectedActions, setSelectedActions] = useState<Record<string, boolean>>({});
  const [pending, setPending] = useState(false);

  const effectiveResourceType = resourcePreset === "custom" ? customResourceType.trim() : resourcePreset;
  const knownActions = useMemo(() => {
    if (resourcePreset === "custom") return [] as string[];
    return [...RESOURCE_ACTIONS[resourcePreset]];
  }, [resourcePreset]);

  function toggleAction(action: string, checked: boolean) {
    setSelectedActions((prev) => ({ ...prev, [action]: checked }));
  }

  async function submit() {
    const subjectId =
      subjectKind === "user" ? userSubjectId.trim() : roleSubjectId;
    if (!subjectId) {
      toast.error(subjectKind === "user" ? "Select a member" : "Select a role");
      return;
    }
    if (!resourceId.trim()) {
      toast.error("Resource id is required");
      return;
    }
    if (!effectiveResourceType) {
      toast.error("Resource type is required");
      return;
    }

    let actions: string[] = [];
    if (resourcePreset === "custom") {
      actions = customActionsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      actions = knownActions.filter((a) => selectedActions[a]);
    }

    setPending(true);
    try {
      await grantPermissionAction({
        organizationId,
        orgSlug,
        subjectId,
        subjectType: subjectKind,
        resourceType: effectiveResourceType,
        resourceId: resourceId.trim(),
        actions,
        expiresAt: expiry.trim() ? `${expiry.trim()}T23:59:59.000Z` : null,
      });
      toast.success("Permission saved");
      setOpen(false);
      setResourceId("");
      setCustomResourceType("");
      setCustomActionsText("");
      setExpiry("");
      setSelectedActions({});
      await onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not grant permission");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? <Button size="sm">Grant permission</Button>}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Grant permission</DialogTitle>
          <DialogDescription>
            Grant a member or everyone with an org role access to a resource. For organization settings,
          choose presets such as <code className="text-xs">org_team</code>,{" "}
          <code className="text-xs">org_billing</code>, or <code className="text-xs">org_webhooks</code> and use this
          organization&apos;s id (or <code className="text-xs">*</code>) as resource id.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label>Subject</Label>
            <Select
              value={subjectKind}
              onValueChange={(v) => setSubjectKind(v as "user" | "org_role")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Member</SelectItem>
                <SelectItem value="org_role">Org role</SelectItem>
              </SelectContent>
            </Select>
            {subjectKind === "user" ? (
              <Select value={userSubjectId} onValueChange={setUserSubjectId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.userId}>
                      {m.user?.email ?? m.userId}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Select value={roleSubjectId} onValueChange={setRoleSubjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ORG_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Resource type</Label>
            <Select
              value={resourcePreset}
              onValueChange={(v) => setResourcePreset(v as KnownResourceType | "custom")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KNOWN_RESOURCE_TYPE_OPTIONS.map((k) => (
                  <SelectItem key={k} value={k}>
                    {k}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            {resourcePreset === "custom" ? (
              <>
                <Input
                  placeholder="e.g. folder"
                  value={customResourceType}
                  onChange={(e) => setCustomResourceType(e.target.value)}
                />
                <Label className="text-muted-foreground text-xs font-normal">
                  Actions (comma-separated, lowercase snake_case)
                </Label>
                <Input
                  placeholder="read, write"
                  value={customActionsText}
                  onChange={(e) => setCustomActionsText(e.target.value)}
                />
              </>
            ) : null}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="perm-resource-id">Resource id</Label>
            <Input
              id="perm-resource-id"
              placeholder="UUID or *"
              value={resourceId}
              onChange={(e) => setResourceId(e.target.value)}
            />
          </div>

          {resourcePreset !== "custom" ? (
            <div className="grid gap-2">
              <Label>Actions</Label>
              <div className="flex flex-col gap-2 rounded-md border p-3">
                {knownActions.map((action) => (
                  <label key={action} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={Boolean(selectedActions[action])}
                      onCheckedChange={(c) => toggleAction(action, c === true)}
                    />
                    {action}
                  </label>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-2">
            <Label htmlFor="perm-expiry">Expires (optional)</Label>
            <Input
              id="perm-expiry"
              type="date"
              value={expiry}
              onChange={(e) => setExpiry(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={pending} onClick={() => void submit()}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
