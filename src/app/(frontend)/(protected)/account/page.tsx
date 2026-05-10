"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { changePasswordAction, updateProfileAction } from "@/lib/actions/account";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { passwordSchema } from "@/lib/auth/schemas";
import { useSessionQuery } from "@/lib/query/hooks";
import { queryKeys } from "@/lib/query/keys";
import { useQueryClient } from "@tanstack/react-query";

const profileSchema = z.object({
  name: z.string().min(1, "Name is required").max(120, "Use at most 120 characters"),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password required"),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ProfileValues = z.infer<typeof profileSchema>;
type PasswordValues = z.infer<typeof changePasswordSchema>;

export default function AccountPage() {
  const queryClient = useQueryClient();
  const { data: session, isLoading } = useSessionQuery();

  const email = session?.user?.email ?? "";
  const userName = session?.user?.name ?? "";
  const userImage = session?.user?.image ?? null;

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: session?.user?.name ?? "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const n = session?.user?.name;
    if (typeof n === "string") profileForm.reset({ name: n });
  }, [session?.user?.name, profileForm]);

  const profileSubmitting = profileForm.formState.isSubmitting;
  const passwordSubmitting = passwordForm.formState.isSubmitting;

  const initials = useMemo(() => {
    const n = userName.trim();
    if (!n && email) return email.slice(0, 2).toUpperCase();
    if (!n) return "?";
    return n
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [email, userName]);

  async function onProfileSubmit(values: ProfileValues) {
    try {
      await updateProfileAction(values);
      toast.success("Profile updated");
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update profile");
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    try {
      await changePasswordAction({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success("Password updated");
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      await queryClient.invalidateQueries({ queryKey: queryKeys.session });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update password");
    }
  }

  if (isLoading && !session) {
    return <p className="text-sm text-muted-foreground">Loading account…</p>;
  }

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col space-y-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">General</h1>
      </div>

      <div className="space-y-6">
        <Card className="pb-3 pt-6">
          <CardHeader className="pb-6">
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Your identity in the app. Email comes from your sign-in account. Update how your name appears to
              teammates.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-0">
            <div className="flex items-center gap-4">
              <Avatar className="size-14">
                <AvatarImage src={userImage ?? undefined} alt="" />
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-medium">{userName || "—"}</p>
                <p className="truncate text-sm text-muted-foreground">{email || "—"}</p>
              </div>
            </div>

            <Form {...profileForm}>
              <form
                id="account-profile-form"
                className="max-w-md space-y-4"
                onSubmit={profileForm.handleSubmit(onProfileSubmit)}
              >
                <FormField
                  control={profileForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display name</FormLabel>
                      <FormControl>
                        <Input
                          autoComplete="name"
                          maxLength={120}
                          disabled={profileSubmitting}
                          {...field}
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
            <p className="text-sm text-muted-foreground">Use at most 120 characters.</p>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              form="account-profile-form"
              disabled={profileSubmitting}
              className="gap-2"
            >
              {profileSubmitting ? (
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

        <Card className="pb-3 pt-6">
          <CardHeader className="pb-6">
            <CardTitle>Password</CardTitle>
            <CardDescription>
              You may need to sign in again on other devices after changing your password.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-0">
            <Form {...passwordForm}>
              <form
                id="account-password-form"
                className="max-w-md space-y-4"
                onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              >
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          disabled={passwordSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          disabled={passwordSubmitting}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          disabled={passwordSubmitting}
                          {...field}
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
            <p className="text-sm text-muted-foreground">New password must be at least 8 characters.</p>
            <Button
              variant="outline"
              size="sm"
              type="submit"
              form="account-password-form"
              disabled={passwordSubmitting}
              className="gap-2"
            >
              {passwordSubmitting ? (
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

        <Card className="py-6">
          <CardHeader className="pb-2">
            <CardTitle>Password reset via email</CardTitle>
            <CardDescription>
              If you&apos;re locked out, use <span className="font-medium text-foreground">Forgot password</span>{" "}
              on the sign-in page to receive a reset link.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
