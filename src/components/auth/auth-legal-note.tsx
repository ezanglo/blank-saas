import Link from "next/link"

export function AuthLegalNote() {
  return (
    <p className="text-center text-xs text-muted-foreground text-balance">
      By signing in or creating an account, you agree to our{" "}
      <Link href="/legal/terms" className="underline underline-offset-4 hover:text-primary">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/legal/privacy" className="underline underline-offset-4 hover:text-primary">
        Privacy Policy
      </Link>
      .
    </p>
  )
}
