import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <main className="min-h-screen bg-muted/20 px-6 py-10 text-foreground">{children}</main>
  );
}
