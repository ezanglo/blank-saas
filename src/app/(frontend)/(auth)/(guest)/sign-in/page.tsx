import { Suspense } from "react";

import { SignInForm } from "@/components/auth/sign-in-form";
import { isGoogleOAuthConfigured } from "@/lib/auth/oauth-env";

function SignInLoading() {
  return (
    <div className="h-[28rem] w-full animate-pulse rounded-xl border bg-card/40" aria-hidden />
  );
}

export default async function AuthSignInPage() {
  const googleEnabled = isGoogleOAuthConfigured();
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm googleEnabled={googleEnabled} />
    </Suspense>
  );
}
