import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";

export default async function ProtectedLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (!session) {
    redirect("/sign-in");
  }

  return (
    <DashboardShell
      user={{
        name: session.user.name ?? null,
        email: session.user.email,
        image: session.user.image ?? null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
