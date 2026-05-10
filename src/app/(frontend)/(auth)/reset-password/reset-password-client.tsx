"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export function ResetPasswordClient({
  token,
  callbackError,
}: {
  token: string | undefined;
  callbackError: string | undefined;
}) {
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;
    setPending(true);
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const res = await fetch(`${origin}/api/auth/reset-password`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ newPassword: password, token }),
    });
    setPending(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(body?.message ?? "Reset failed");
      return;
    }
    toast.success("Password updated — you can sign in.");
    window.location.href = "/sign-in";
  }

  const err = callbackError ?? (!token ? "Missing or expired token." : undefined);

  if (err) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-sm text-destructive">{decodeURIComponent(err)}</p>
        <Link href="/forgot-password" className="text-sm underline underline-offset-4">
          Request another link
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label htmlFor="pw" className="text-sm font-medium">
          New password
        </label>
        <input
          id="pw"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          className={cn(inputClass)}
          value={password}
          onChange={(v) => setPassword(v.target.value)}
        />
      </div>
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Updating…" : "Set password"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/sign-in" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Sign in instead
        </Link>
      </p>
    </form>
  );
}
