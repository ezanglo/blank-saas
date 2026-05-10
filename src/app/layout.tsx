import type { ReactNode } from "react";

/**
 * Next.js **requires** a root `src/app/layout.tsx` for the App Router (see Layouts → root layout
 * in the Next.js docs). Payload’s embedded admin **`RootLayout`** also renders a **full HTML
 * document**. If this file wrapped `{children}` in `<html><body>`, `/admin` would end up as
 * nested documents and React would hydrate incorrectly.
 *
 * So this root is intentionally a transparent wrapper: **`(frontend)`** and **`(payload)`** are
 * sibling segments, each owning its own document layout. That’s the standard pattern when
 * co-locating Payload admin with a Next theme shell.
 *
 * “Better” escapes are mostly heavier (separate Payload/Next deployments, subdomain rewrites).
 */
export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return children;
}
