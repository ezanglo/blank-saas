"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
import {
  type ResetPasswordValues,
  resetPasswordSchema,
} from "@/lib/auth/schemas";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function onSubmit(data: ResetPasswordValues) {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${origin}/api/auth/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ newPassword: data.password, token }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(
        typeof body?.message === "string" ? body.message : "Reset failed",
      );
      return;
    }
    toast.success("Password updated — you can sign in.");
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input
                  autoComplete="new-password"
                  type="password"
                  className="ph-no-capture"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <Input
                  autoComplete="new-password"
                  type="password"
                  className="ph-no-capture"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="w-full"
        >
          {form.formState.isSubmitting ? "Updating…" : "Set password"}
        </Button>
        <p className="text-center text-sm">
          <Link
            href="/sign-in"
            className="text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            Sign in instead
          </Link>
        </p>
      </form>
    </Form>
  );
}
