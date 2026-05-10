"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { authClient } from "@/lib/auth-client";
import { type SignInValues, signInSchema } from "@/lib/auth/schemas";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(data: SignInValues) {
    const res = await authClient.signIn.email({
      email: data.email.trim(),
      password: data.password,
    });
    if (res.error) {
      toast.error(res.error.message ?? "Sign-in failed");
      return;
    }
    toast.success("Signed in");
    const redirect =
      searchParams.get("callbackUrl") ??
      searchParams.get("redirect") ??
      "/";
    router.push(redirect);
    router.refresh();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input autoComplete="email" type="email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  autoComplete="current-password"
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
          {form.formState.isSubmitting ? "Signing in…" : "Continue"}
        </Button>
      </form>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <Link
          href="/forgot-password"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Forgot password?
        </Link>
        <Link
          href="/sign-up"
          className="underline underline-offset-4 hover:text-foreground"
        >
          Create account
        </Link>
      </div>
    </Form>
  );
}
