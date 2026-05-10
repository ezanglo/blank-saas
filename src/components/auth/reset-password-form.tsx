"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { type ResetPasswordValues, resetPasswordSchema } from "@/lib/auth/schemas";

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
      toast.error(typeof body?.message === "string" ? body.message : "Reset failed");
      return;
    }
    toast.success("Password updated — you can sign in.");
    router.push("/sign-in");
    router.refresh();
  }

  return (
    <Card className="gap-10 pt-8 pb-10">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Choose a new password</CardTitle>
        <CardDescription>
          Open this flow from your email — the verification token stays in your link.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-8">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className="@container/form-item gap-6">
                    <Field>
                      <FieldLabel htmlFor="reset-password-new">New password</FieldLabel>
                      <FormControl>
                        <Input
                          id="reset-password-new"
                          autoComplete="new-password"
                          type="password"
                          className="ph-no-capture"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem className="@container/form-item gap-6">
                    <Field>
                      <FieldLabel htmlFor="reset-password-confirm">Confirm password</FieldLabel>
                      <FormControl>
                        <Input
                          id="reset-password-confirm"
                          autoComplete="new-password"
                          type="password"
                          className="ph-no-capture"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />
              <Field>
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? "Updating…" : "Set password"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </Form>
        <p className="mt-8 text-center text-sm">
          <Link
            href="/sign-in"
            className="text-muted-foreground underline underline-offset-4 hover:text-primary"
          >
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
