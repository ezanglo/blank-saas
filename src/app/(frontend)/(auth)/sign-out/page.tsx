"use client";

import { useEffect } from "react";

import { authClient } from "@/lib/auth-client";

export default function AuthSignOutPage() {
  useEffect(() => {
    void (async () => {
      await authClient.signOut();
      window.location.replace("/");
    })();
  }, []);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Signing out…
    </div>
  );
}
