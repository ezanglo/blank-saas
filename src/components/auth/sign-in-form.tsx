"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { domainHasSamlSsoAction } from "@/lib/actions/sso-domain";
import { authClient } from "@/lib/auth-client";
import { type SignInValues, signInSchema } from "@/lib/auth/schemas";
import { refreshClientSessionCache } from "@/lib/query/hooks";

export function SignInForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const redirect =
    searchParams.get("callbackUrl") ??
    searchParams.get("redirect") ??
    "/dashboard";

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const emailWatch = form.watch("email");
  const [ssoAvailable, setSsoAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const email = emailWatch.trim();
    const handle = setTimeout(() => {
      void (async () => {
        if (!email.includes("@")) {
          if (!cancelled) setSsoAvailable(false);
          return;
        }
        try {
          const ok = await domainHasSamlSsoAction(email);
          if (!cancelled) setSsoAvailable(ok);
        } catch {
          if (!cancelled) setSsoAvailable(false);
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(handle);
    };
  }, [emailWatch]);

  async function signInWithSso() {
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ??
      process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
      (typeof window !== "undefined" ? window.location.origin : "");
    const email = form.getValues("email").trim();
    if (!email) {
      toast.error("Enter your work email to use SSO");
      return;
    }
    try {
      const res = await fetch(`${origin}/api/auth/sign-in/sso`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          callbackURL: redirect,
          providerType: "saml",
        }),
      });
      let payload: { url?: string; message?: string } = {};
      try {
        payload = (await res.json()) as { url?: string; message?: string };
      } catch {
        payload = {};
      }
      if (!res.ok) {
        throw new Error(payload.message ?? "SSO sign-in failed");
      }
      if (payload.url) {
        window.location.href = payload.url;
        return;
      }
      throw new Error("No redirect URL returned");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "SSO sign-in failed");
    }
  }

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
    await refreshClientSessionCache(queryClient);
    router.push(redirect);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-10 pt-8 pb-10">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Welcome back</CardTitle>
          <CardDescription>
            {googleEnabled ? "Continue with Google or your email." : "Sign in with your email."}
          </CardDescription>
        </CardHeader>
        <CardContent className="@container/card">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <FieldGroup className="gap-8">
                {googleEnabled ? (
                  <>
                    <Field>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() =>
                          void authClient.signIn.social({
                            provider: "google",
                            callbackURL: redirect,
                          })
                        }
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="size-4 shrink-0">
                          <title>Google logo</title>
                          <path
                            d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                            fill="currentColor"
                          />
                        </svg>
                        Continue with Google
                      </Button>
                    </Field>
                    <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                      Or continue with email
                    </FieldSeparator>
                  </>
                ) : null}
                <FieldGroup className="@container/field-group gap-8">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="@container/form-item gap-6">
                        <Field>
                          <FieldLabel htmlFor="sign-in-email-input">Email</FieldLabel>
                          <FormControl>
                            <Input
                              id="sign-in-email-input"
                              autoComplete="email"
                              type="email"
                              placeholder="m@example.com"
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
                    name="password"
                    render={({ field }) => (
                      <FormItem className="@container/form-item gap-6">
                        <Field>
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <FieldLabel htmlFor="sign-in-password-input">Password</FieldLabel>
                            <Link
                              href="/forgot-password"
                              className="text-xs underline underline-offset-4 hover:text-primary"
                            >
                              Forgot password?
                            </Link>
                          </div>
                          <FormControl>
                            <Input
                              id="sign-in-password-input"
                              autoComplete="current-password"
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
                  {ssoAvailable ? (
                    <Field>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => void signInWithSso()}
                      >
                        Sign in with SSO
                      </Button>
                      <FieldDescription className="text-center">
                        Your email domain is enrolled for SAML SSO.
                      </FieldDescription>
                    </Field>
                  ) : null}
                  <Field>
                    <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                      {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
                    </Button>
                    <FieldDescription className="text-center">
                      Don&apos;t have an account?{" "}
                      <Link href="/sign-up" className="underline underline-offset-4 hover:text-primary">
                        Sign up
                      </Link>
                    </FieldDescription>
                  </Field>
                </FieldGroup>
              </FieldGroup>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
