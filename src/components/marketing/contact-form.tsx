"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState, type BaseSyntheticEvent } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PUBLIC_GITHUB_REPO_URL } from "@/lib/marketing/public-repo";

const formSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("Valid email required").max(254),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least a few sentences")
    .max(8000),
});

export type ContactFormValues = z.infer<typeof formSchema>;

export function ContactForm({ githubIssuesUrl }: { githubIssuesUrl: string }) {
  const [pending, setPending] = useState(false);

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", message: "" },
  });

  async function onSubmit(values: ContactFormValues, event?: BaseSyntheticEvent) {
    const formEl = event?.currentTarget;
    const hp =
      formEl && formEl instanceof HTMLFormElement
        ? String(new FormData(formEl).get("_hp") ?? "")
        : "";

    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          _hp: hp,
        }),
      });
      const data: unknown = await res.json().catch(() => ({}));

      if (!res.ok) {
        const err =
          typeof data === "object" && data !== null && "error" in data
            ? String((data as { error?: unknown }).error)
            : "Could not send";
        toast.error(err);
        return;
      }

      const delivered =
        typeof data === "object" &&
        data !== null &&
        "delivered" in data &&
        (data as { delivered?: boolean }).delivered === true;

      toast.success("Thanks — we received your message.");
      if (!delivered) {
        toast.message("Self-host note", {
          description:
            "SMTP + CONTACT_INBOX are not configured; your note was logged on the server only.",
        });
      }
      form.reset();
    } catch {
      toast.error("Network error — try again or open an issue on GitHub.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-muted-foreground">
        For bugs and feature ideas,{" "}
        <Link
          href={githubIssuesUrl}
          className="font-medium text-foreground underline underline-offset-4"
          target="_blank"
          rel="noreferrer"
        >
          GitHub issues
        </Link>{" "}
        are usually fastest. Use this form for private or one-off questions.
      </p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <input
            type="text"
            name="_hp"
            tabIndex={-1}
            autoComplete="off"
            defaultValue=""
            className="pointer-events-none absolute left-0 top-0 h-0 w-0 opacity-0"
            aria-hidden
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" autoComplete="email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="message"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Message</FormLabel>
                <FormControl>
                  <Textarea
                    rows={6}
                    className="min-h-[140px] resize-y"
                    placeholder="What would you like to ask?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Sending…" : "Send message"}
          </Button>
        </form>
      </Form>

      <p className="text-xs text-muted-foreground">
        Repo:{" "}
        <Link
          href={PUBLIC_GITHUB_REPO_URL}
          className="underline underline-offset-4 hover:text-foreground"
          target="_blank"
          rel="noreferrer"
        >
          {PUBLIC_GITHUB_REPO_URL.replace(/^https?:\/\//, "")}
        </Link>
      </p>
    </div>
  );
}
