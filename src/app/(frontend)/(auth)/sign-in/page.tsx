import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";

function SignInShell() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center md:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">Welcome back</p>
      </div>
      <SignInForm />
    </div>
  );
}

export default function AuthSignInPage() {
  return (
    <Suspense
      fallback={
        <div className="text-sm text-muted-foreground">Loading…</div>
      }
    >
      <SignInShell />
    </Suspense>
  );
}
