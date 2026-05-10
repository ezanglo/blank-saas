import Link from "next/link";

import { AdminResetPasswordClient } from "./reset-password-client";

export default async function AdminResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token, error } = await searchParams;

  return (
    <>
      <div className="space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          Open this page from the link in your email.
        </p>
      </div>
      <AdminResetPasswordClient token={token} callbackError={error} />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/admin/auth/sign-in" className="underline underline-offset-4 hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </>
  );
}
