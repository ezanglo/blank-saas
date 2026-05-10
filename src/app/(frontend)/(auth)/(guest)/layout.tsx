import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { auth } from "@/lib/auth";
import { headersToWebRequestHeaders } from "@/lib/auth/headers";

/** Guest-only auth screens; signed-in users skip these and go to app entry (see `/dashboard` redirect). */
export default async function AuthGuestLayout({ children }: { children: ReactNode }) {
  const h = await headers();
  const session = await auth.api.getSession({ headers: headersToWebRequestHeaders(h) });
  if (session?.user?.id) {
    redirect("/dashboard");
  }

  return children;
}
