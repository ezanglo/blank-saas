"use client";

import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function AdminSignOutPage() {
  useEffect(() => {
    void (async () => {
      await authClient.signOut();
      window.location.replace("/admin/auth/sign-in");
    })();
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Signing out…
    </div>
  );
}
