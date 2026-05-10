import { SignUpForm } from "@/components/auth/sign-up-form";

export default function AuthSignUpPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center md:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          First member is promoted to{" "}
          <code className="text-xs">admin</code> for Payload CMS access once a
          session exists.
        </p>
      </div>
      <SignUpForm />
    </div>
  );
}
