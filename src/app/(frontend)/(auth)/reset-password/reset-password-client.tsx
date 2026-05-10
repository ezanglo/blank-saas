"use client";

import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/reset-password-form";

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
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">{decodeURIComponent(err)}</p>
        <Link
          href="/forgot-password"
          className="text-sm underline underline-offset-4"
        >
          Request another link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token!} />;
}
