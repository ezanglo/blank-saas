"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const inputClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

export default function AuthSignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setPending(true);
    const res = await authClient.signUp.email({
      name: name.trim(),
      email: email.trim(),
      password,
    });
    setPending(false);
    if (res.error) {
      toast.error(res.error.message ?? "Sign-up failed");
      return;
    }
    toast.success("Check your email to verify — then sign in.", { duration: 8000 });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1 text-center md:text-left">
        <h1 className="text-2xl font-semibold tracking-tight">Create account</h1>
        <p className="text-sm text-muted-foreground">
          First member is promoted to <code className="text-xs">admin</code> for Payload CMS access once a session exists.
        </p>
      </div>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="name" className="text-sm font-medium">
            Name
          </label>
          <input
            id="name"
            autoComplete="name"
            required
            className={cn(inputClass)}
            value={name}
            onChange={(v) => setName(v.target.value)}
          />
        </div>
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
        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <input
            id="password"
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
          {pending ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/sign-in" className="underline underline-offset-4 hover:text-foreground">
          Sign in
        </Link>
      </p>
    </div>
  );
}
