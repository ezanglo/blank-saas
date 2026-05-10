"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function OrgSubNav({
  orgSlug,
  showSettings,
}: {
  orgSlug: string;
  showSettings: boolean;
}) {
  const pathname = usePathname();
  const base = `/organizations/${orgSlug}`;

  const items = [
    { href: base, label: "Overview", match: (p: string) => p === base },
    { href: `${base}/members`, label: "Members", match: (p: string) => p.startsWith(`${base}/members`) },
    {
      href: `${base}/invitations`,
      label: "Invitations",
      match: (p: string) => p.startsWith(`${base}/invitations`),
    },
    ...(showSettings
      ? [
          {
            href: `${base}/settings`,
            label: "Settings",
            match: (p: string) => p.startsWith(`${base}/settings`),
          },
        ]
      : []),
  ] as const;

  return (
    <nav className="flex flex-wrap gap-2 border-b pb-3">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            pathname && item.match(pathname)
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
