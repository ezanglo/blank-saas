"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

import { PAGEVIEW } from "@/lib/analytics/events";

function posthogPublicKey(): string | undefined {
  const k = process.env.NEXT_PUBLIC_POSTHOG_KEY?.trim();
  return k || undefined;
}

function posthogHost(): string {
  return process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim() || "https://app.posthog.com";
}

function PostHogInitAndProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const key = posthogPublicKey();
    if (!key) return;
    posthog.init(key, {
      api_host: posthogHost(),
      capture_pageview: false,
      persistence: "localStorage",
    });
  }, []);

  const key = posthogPublicKey();
  if (!key) {
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

function PostHogPageViewInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!posthogPublicKey()) return;
    const search = searchParams?.toString();
    const url = search ? `${pathname}?${search}` : pathname ?? "";
    if (!url) return;
    posthog.capture(PAGEVIEW, { $current_url: typeof window !== "undefined" ? window.location.href : url });
  }, [pathname, searchParams]);

  return null;
}

export function PostHogPageView() {
  return (
    <Suspense fallback={null}>
      <PostHogPageViewInner />
    </Suspense>
  );
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogInitAndProvider>{children}</PostHogInitAndProvider>;
}

export type PostHogIdentifyProps = {
  userId: string;
  email?: string | null;
  name?: string | null;
};

/** Call from protected shell after session is known (PRD §30.6). */
export function PostHogIdentify({ userId, email, name }: PostHogIdentifyProps) {
  useEffect(() => {
    if (!posthogPublicKey() || !userId) return;
    posthog.identify(userId, {
      email: email ?? undefined,
      name: name ?? undefined,
    });
  }, [userId, email, name]);

  return null;
}
