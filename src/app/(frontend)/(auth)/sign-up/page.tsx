import { SignUpForm } from "@/components/auth/sign-up-form";
import { isGoogleOAuthConfigured } from "@/lib/auth/oauth-env";

export default async function AuthSignUpPage() {
  const googleEnabled = isGoogleOAuthConfigured();
  return <SignUpForm googleEnabled={googleEnabled} />;
}
