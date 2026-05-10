"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

import { PostHogPageView, PostHogProvider } from "@/lib/analytics/client";
import { QueryProvider } from "@/components/query-provider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <PostHogProvider>
      <PostHogPageView />
      <QueryProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster richColors closeButton />
        </ThemeProvider>
      </QueryProvider>
    </PostHogProvider>
  );
}
