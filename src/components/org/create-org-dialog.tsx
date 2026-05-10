"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import slugify from "slugify";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { createOrganizationAction } from "@/lib/actions/organization";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
});

type Values = z.infer<typeof schema>;

export function CreateOrganizationDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
}: {
  trigger?: React.ReactNode;
  /** Controlled dialog (no trigger unless `trigger` is passed). */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [internalOpen, setInternalOpen] = useState(false);
  const controlled = openProp !== undefined && onOpenChangeProp !== undefined;
  const open = controlled ? openProp : internalOpen;
  const setOpen = controlled ? onOpenChangeProp : setInternalOpen;
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", slug: "" },
  });

  async function onSubmit(values: Values) {
    const slugRaw = values.slug?.trim();
    const name = values.name.trim();
    const slug =
      slugRaw ||
      slugify(name, { lower: true, strict: true }) ||
      slugify(Math.random().toString(36).slice(2, 8), { lower: true, strict: true });
    try {
      const org = (await createOrganizationAction({
        name,
        slug,
      })) as { slug: string };
      toast.success("Organization created");
      await queryClient.invalidateQueries({ queryKey: queryKeys.organizations.all });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
      form.reset({ name: "", slug: "" });
      setOpen(false);
      router.push(`/organizations/${org.slug}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create organization");
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
          {trigger ?? <Button size="sm">Create organization</Button>}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create organization</DialogTitle>
          <DialogDescription>
            Add a new workspace. Leave the slug blank to generate it from the name, or enter a custom URL segment.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="flex flex-col gap-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input autoComplete="organization" placeholder="Acme Corp" {...field} />
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
                  <FormLabel>
                    Slug{" "}
                    <span className="font-normal text-muted-foreground">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="acme-corp" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">Create</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
