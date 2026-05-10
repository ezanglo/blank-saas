import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";
import { Providers } from "@/components/providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Blank SaaS",
  description: "Open source multi-tenant Next.js starter (Payload, Better Auth, Postgres).",
};

/**
 * Document shell for the Next app (marketing, auth, dashboard).
 * Sibling `src/app/(payload)/` uses Payload’s `RootLayout`, which renders its own `<html>/<body>` — it must not nest under this tree.
 */
export default function FrontendDocumentLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
