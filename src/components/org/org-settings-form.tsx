"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import {
  deleteOrganizationAction,
  updateOrganizationAction,
} from "@/lib/actions/organization";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { canDeleteOrganization } from "@/lib/auth/rbac";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

const updateSchema = z.object({
  name: z.string().min(1, "Name required"),
  slug: z.string().min(1, "Slug required"),
});

type Values = z.infer<typeof updateSchema>;

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const form = useForm<Values>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
      name: org.name,
      slug: org.slug,
    },
  });

  async function save(values: Values) {
    const name = values.name.trim();
    const slugInput = values.slug.trim();
    const slug =
      slugify(slugInput, { lower: true, strict: true }) || slugify(name, { lower: true, strict: true }) || slugInput;

    try {
      await updateOrganizationAction({
        organizationId: org.id,
        name,
        slug,
      });
      toast.success("Organization updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      router.refresh();
      if (slug !== org.slug) {
        router.replace(`/organizations/${slug}/settings`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Rename your workspace or update its slug. Only admins can change these settings.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>General</CardTitle>
          <CardDescription>Displayed name and URL slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(save)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input {...field} spellCheck={false} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Save changes</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {canDeleteOrganization(viewerRole) ? (
        <DeleteOrganizationCard organizationId={org.id} slug={org.slug} />
      ) : (
        <p className="text-sm text-muted-foreground">
          Only owners can delete an organization from this dashboard.
        </p>
      )}
    </div>
  );
}

function DeleteOrganizationCard({ organizationId, slug }: { organizationId: string; slug: string }) {
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
      toast.success("Organization deleted");
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
    <Card className="border-destructive/40">
      <CardHeader className="pb-2">
        <CardTitle className="text-destructive">Danger zone</CardTitle>
        <CardDescription>Permanently delete this organization.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="destructive">Delete organization</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete organization</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Type <code className="rounded bg-muted px-1">{slug}</code> to confirm.
            </p>
            <Input value={confirmSlug} onChange={(e) => setConfirmSlug(e.target.value)} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" disabled={pending} onClick={() => void destroy()}>
                Delete permanently
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
