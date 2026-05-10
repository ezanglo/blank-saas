import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function AuthForgotPasswordPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Forgot password
        </h1>
        <p className="text-sm text-muted-foreground">
          We&apos;ll email a reset link when SMTP is configured.
        </p>
      </div>
      <ForgotPasswordForm />
    </div>
  );
}
