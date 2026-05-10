"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { type ForgotPasswordValues, forgotPasswordSchema } from "@/lib/auth/schemas";

export function ForgotPasswordForm() {
  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(data: ForgotPasswordValues) {
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const res = await fetch(`${base}/api/auth/request-password-reset`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        email: data.email.trim(),
        redirectTo: `${base}/reset-password`,
      }),
    }).catch(() => null);
    if (!res?.ok) {
      toast.error("Could not send reset email");
      return;
    }
    toast.success("If that email exists, a reset link was sent.");
    form.reset({ email: "" });
  }

  return (
    <Card className="gap-10 pt-8 pb-10">
      <CardHeader className="text-center">
        <CardTitle className="text-xl">Forgot password</CardTitle>
        <CardDescription>
          We&apos;ll email a reset link when SMTP is configured.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <FieldGroup className="gap-8">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem className="@container/form-item gap-6">
                    <Field>
                      <FieldLabel htmlFor="forgot-email">Email</FieldLabel>
                      <FormControl>
                        <Input id="forgot-email" autoComplete="email" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </Field>
                  </FormItem>
                )}
              />
              <Field>
                <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                  {form.formState.isSubmitting ? "Sending…" : "Send reset link"}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </Form>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
            Back to sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
