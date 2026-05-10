"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import slugify from "slugify";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteOrganizationAction,
  updateOrganizationAction,
} from "@/lib/actions/organization";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { canDeleteOrganization } from "@/lib/auth/rbac";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

const nameSchema = z.object({
  name: z.string().min(1, "Name is required").max(32, "Use at most 32 characters"),
});

const slugSchema = z.object({
  slug: z
    .string()
    .min(1, "Slug is required")
    .max(48, "Use at most 48 characters"),
});

function orgSlugPreviewBase(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? "http://localhost:3000";
  return `${base}/organizations`;
}

export function OrgSettingsForm({
  org,
  viewerRole,
}: {
  org: {
    id: string;
    name: string;
    slug: string;
  };
  viewerRole: string;
}) {
  const canDestroy = canDeleteOrganization(viewerRole);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">General</h1>
      </div>

      <div className="space-y-6">
        <OrgNameSettingsCard orgId={org.id} initialName={org.name} />
        <OrgUrlSettingsCard orgId={org.id} initialSlug={org.slug} />
        <OrgDangerZoneSection
          organizationId={org.id}
          slug={org.slug}
          canDelete={canDestroy}
        />
      </div>
    </div>
  );
}

function OrgNameSettingsCard({
  orgId,
  initialName,
}: {
  orgId: string;
  initialName: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<z.infer<typeof nameSchema>>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: initialName },
  });

  useEffect(() => {
    form.reset({ name: initialName });
  }, [initialName, form]);

  async function onSubmit(values: z.infer<typeof nameSchema>) {
    const name = values.name.trim();
    try {
      await updateOrganizationAction({
        organizationId: orgId,
        name,
      });
      toast.success("Workspace name updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  }

  const submitting = form.formState.isSubmitting;

  return (
    <Card className="pb-3 pt-6">
      <CardHeader className="pb-6">
        <CardTitle>Workspace name</CardTitle>
        <CardDescription>
          This is your workspace&apos;s visible name—for example your company or team label.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <Form {...form}>
          <form
            id="org-name-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Workspace name</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      maxLength={32}
                      placeholder="My workspace"
                      autoComplete="organization"
                      disabled={submitting}
                      className="max-w-md"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-y-3 border-t border-border pt-3">
        <p className="text-sm text-muted-foreground">Use at most 32 characters.</p>
        <Button
          variant="outline"
          size="sm"
          type="submit"
          form="org-name-form"
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function OrgUrlSettingsCard({
  orgId,
  initialSlug,
}: {
  orgId: string;
  initialSlug: string;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const form = useForm<z.infer<typeof slugSchema>>({
    resolver: zodResolver(slugSchema),
    defaultValues: { slug: initialSlug },
  });

  useEffect(() => {
    form.reset({ slug: initialSlug });
  }, [initialSlug, form]);

  async function onSubmit(values: z.infer<typeof slugSchema>) {
    const slugInput = values.slug.trim();
    const slug = slugify(slugInput, { lower: true, strict: true });
    if (!slug) {
      toast.error("Enter a valid URL slug.");
      return;
    }
    try {
      await updateOrganizationAction({
        organizationId: orgId,
        slug,
      });
      toast.success("Workspace URL updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      router.refresh();
      if (slug !== initialSlug) {
        router.replace(`/organizations/${slug}/settings`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  }

  const submitting = form.formState.isSubmitting;
  const previewBase = orgSlugPreviewBase();

  return (
    <Card className="pb-3 pt-6">
      <CardHeader className="pb-6">
        <CardTitle>Workspace URL</CardTitle>
        <CardDescription>
          The slug identifies this workspace in the app URL. Changing it updates links shared with your
          team.
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <Form {...form}>
          <form
            id="org-url-form"
            className="space-y-4"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">URL slug</FormLabel>
                  <FormControl>
                    <div className="flex max-w-lg overflow-hidden rounded-md border border-input bg-muted/50">
                      <span className="truncate border-input border-r bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {previewBase}/
                      </span>
                      <Input
                        {...field}
                        spellCheck={false}
                        maxLength={48}
                        placeholder="acme-team"
                        autoComplete="off"
                        disabled={submitting}
                        className="rounded-none border-0 bg-transparent focus-visible:ring-0 md:text-sm"
                        aria-label="Workspace URL slug"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-y-3 border-t border-border pt-3">
        <p className="text-sm text-muted-foreground">Use at most 48 characters.</p>
        <Button
          variant="outline"
          size="sm"
          type="submit"
          form="org-url-form"
          disabled={submitting}
          className="gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            "Save"
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

function OrgDangerZoneSection({
  organizationId,
  slug,
  canDelete,
}: {
  organizationId: string;
  slug: string;
  canDelete: boolean;
}) {
  return (
    <Card className="border-destructive/50 bg-muted/30 py-6">
      <CardHeader className="pb-2">
        <CardTitle>Danger zone</CardTitle>
      </CardHeader>
      <CardContent className="px-6">
        <div className="divide-y divide-border">
          <DangerRow
            title="Transfer ownership"
            description="Give this workspace to another member. You will no longer be the owner."
            action={
              <Button variant="outline" size="sm" className="shrink-0" disabled type="button">
                Transfer
              </Button>
            }
          />
          <DangerRow
            title="Leave workspace"
            description="Leave this workspace. You will lose access to its resources unless invited again."
            action={
              <Button variant="outline" size="sm" className="shrink-0" disabled type="button">
                Leave workspace
              </Button>
            }
          />
          <DangerRow
            title="Delete workspace"
            description="Permanently delete this workspace and its data for all members. This cannot be undone."
            action={
              canDelete ? (
                <DeleteWorkspaceControl organizationId={organizationId} slug={slug} />
              ) : (
                <Button variant="destructive" size="sm" className="shrink-0" disabled type="button">
                  Delete workspace
                </Button>
              )
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function DangerRow({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}

function DeleteWorkspaceControl({
  organizationId,
  slug,
}: {
  organizationId: string;
  slug: string;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [confirmSlug, setConfirmSlug] = useState("");
  const [pending, setPending] = useState(false);

  async function destroy() {
    if (confirmSlug.trim() !== slug) {
      toast.error("Slug does not match");
      return;
    }
    setPending(true);
    try {
      await deleteOrganizationAction(organizationId);
      toast.success("Workspace deleted");
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      setOpen(false);
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="shrink-0" type="button">
          Delete workspace
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete workspace</DialogTitle>
          <DialogDescription>
            This permanently deletes the workspace and associated data for all members.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Type <code className="rounded bg-muted px-1">{slug}</code> to confirm.
        </p>
        <Input value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} />
        <DialogFooter className="gap-2">
          <Button variant="outline" type="button" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" disabled={pending} onClick={() => void destroy()}>
            Delete permanently
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
