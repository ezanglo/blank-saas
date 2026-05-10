"use client";

import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResetPasswordClient({
  token,
  callbackError,
}: {
  token: string | undefined;
  callbackError: string | undefined;
}) {
  const err =
    callbackError ?? (!token ? "Missing or expired token." : undefined);

  if (err) {
    return (
      <Card className="gap-10 pt-8 pb-10">
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Reset link issue</CardTitle>
          <CardDescription className="text-destructive">
            {decodeURIComponent(err)}
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-col gap-3 pt-6">
          <Button asChild variant="outline" className="w-full">
            <Link href="/forgot-password">Request another link</Link>
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/sign-in" className="underline underline-offset-4 hover:text-primary">
              Back to sign in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <>
      <ResetPasswordForm token={token!} />
    </>
  );
}
