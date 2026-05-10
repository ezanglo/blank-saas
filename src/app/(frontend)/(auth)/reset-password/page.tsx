import Link from "next/link";

import { ResetPasswordClient } from "./reset-password-client";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Open this page from the link in your email (token is appended by Better Auth).
        </p>
      </div>
      <ResetPasswordClient token={token} callbackError={error} />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
