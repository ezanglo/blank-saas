"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function AuthForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const base =
      typeof window !== "undefined"
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/$/, "");
    const res = await fetch(`${base}/api/auth/request-password-reset`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email: email.trim(), redirectTo: `${base}/reset-password` }),
    }).catch(() => null);
    setPending(false);
    if (!res?.ok) {
      toast.error("Could not send reset email");
      return;
    }
    toast.success("If that email exists, a reset link was sent.");
    setEmail("");
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Forgot password</h1>
        <p className="text-sm text-muted-foreground">We&apos;ll email a reset link when SMTP is configured.</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            className={cn(inputClass)}
            value={email}
            onChange={(v) => setEmail(v.target.value)}
          />
        </div>
        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send reset link"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
