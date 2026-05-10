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
import { authClient } from "@/lib/auth-client";
import { type SignUpValues, signUpSchema } from "@/lib/auth/schemas";

export function SignUpForm({ googleEnabled }: { googleEnabled: boolean }) {
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignUpValues) {
    const res = await authClient.signUp.email({
      name: data.name.trim(),
      email: data.email.trim(),
      password: data.password,
    });
    if (res.error) {
      toast.error(res.error.message ?? "Sign-up failed");
      return;
    }
    toast.success("Check your email to verify — then sign in.", {
      duration: 8000,
    });
    form.reset();
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="gap-10 pt-8 pb-10">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create an account</CardTitle>
          <CardDescription>
            {googleEnabled
              ? "Use Google or your email."
              : "Use your email. You can join an organization via invite afterward."}{" "}
            First verified member gains admin CMS access once a session exists.
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
                            callbackURL: "/dashboard",
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
                      Or register with email
                    </FieldSeparator>
                  </>
                ) : null}
                <FieldGroup className="@container/field-group gap-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="@container/form-item gap-6">
                        <Field>
                          <FieldLabel htmlFor="sign-up-name">Name</FieldLabel>
                          <FormControl>
                            <Input id="sign-up-name" autoComplete="name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </Field>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="@container/form-item gap-6">
                        <Field>
                          <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
                          <FormControl>
                            <Input id="sign-up-email" autoComplete="email" type="email" {...field} />
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
                          <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
                          <FormControl>
                            <Input
                              id="sign-up-password"
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
                          <FieldLabel htmlFor="sign-up-confirm">Confirm password</FieldLabel>
                          <FormControl>
                            <Input
                              id="sign-up-confirm"
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
                      {form.formState.isSubmitting ? "Creating…" : "Create account"}
                    </Button>
                    <FieldDescription className="text-center">
                      Already have an account?{" "}
                      <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
                        Sign in
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
