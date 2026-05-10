import type { ReactNode } from "react";

import { AuthBrand } from "@/components/auth/auth-brand";
import { AuthLegalNote } from "@/components/auth/auth-legal-note";

/** login-03 outer chrome: muted full-height column. */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-muted p-6 md:p-10">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <AuthBrand />
        {children}
        <AuthLegalNote />
      </div>
    </main>
  );
}
