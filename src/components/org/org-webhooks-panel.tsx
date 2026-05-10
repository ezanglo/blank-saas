"use client";

import type { EndpointOut } from "svix";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  createOrgWebhookEndpointAction,
  deleteOrgWebhookEndpointAction,
} from "@/lib/actions/org-webhooks";
import { WEBHOOK_EVENT_OPTIONS } from "@/lib/webhooks/event-options";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function OrgWebhooksPanel({
  orgId,
  orgSlug,
  endpoints,
  svixConfigured,
}: {
  orgId: string;
  orgSlug: string;
  endpoints: EndpointOut[];
  svixConfigured: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    () => new Set(WEBHOOK_EVENT_OPTIONS),
  );
  const [pending, setPending] = useState(false);

  function toggleType(t: string) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(t)) next.delete(t);
      else next.add(t);
      return next;
    });
  }

  async function onCreate() {
    setPending(true);
    try {
      await createOrgWebhookEndpointAction({
        organizationId: orgId,
        orgSlug,
        url,
        filterTypes: [...selectedTypes],
      });
      toast.success("Endpoint created");
      setOpen(false);
      setUrl("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create endpoint");
    } finally {
      setPending(false);
    }
  }

  async function onDelete(endpointId: string) {
    if (!confirm("Delete this webhook endpoint?")) return;
    setPending(true);
    try {
      await deleteOrgWebhookEndpointAction({ organizationId: orgId, orgSlug, endpointId });
      toast.success("Endpoint deleted");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {!svixConfigured ? (
        <p className="text-amber-600 text-sm dark:text-amber-400">
          Svix env vars are not set. Add <code className="text-xs">SVIX_SERVER_URL</code> and{" "}
          <code className="text-xs">SVIX_AUTH_TOKEN</code> to enable outbound webhooks.
        </p>
      ) : null}

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={!svixConfigured}>
              Add endpoint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
            <DialogHeader>
              <DialogTitle>New webhook endpoint</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-1">
                <Label htmlFor="wh-url">URL</Label>
                <Input
                  id="wh-url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/webhook"
                  autoComplete="off"
                />
              </div>
              <div className="grid gap-2">
                <Label>Event types</Label>
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-2">
                  {WEBHOOK_EVENT_OPTIONS.map((t) => (
                    <label key={t} className="flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selectedTypes.has(t)}
                        onChange={() => toggleType(t)}
                      />
                      <span className="font-mono text-xs">{t}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={() => void onCreate()} disabled={pending}>
                Save
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-hidden rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>URL</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Events</TableHead>
              <TableHead className="w-[100px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {endpoints.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-muted-foreground h-24 text-center text-sm">
                  No endpoints yet.
                </TableCell>
              </TableRow>
            ) : (
              endpoints.map((ep) => (
                <TableRow key={ep.id}>
                  <TableCell className="max-w-[280px] truncate font-mono text-xs">
                    {ep.url}
                  </TableCell>
                  <TableCell>{ep.disabled ? "Disabled" : "Active"}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate text-xs">
                    {(ep.filterTypes ?? []).join(", ") || "All"}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      disabled={pending}
                      onClick={() => void onDelete(ep.id)}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
