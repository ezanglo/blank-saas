"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export function SettingsNav({
  orgSlug,
  showBillingNav,
  showAuditLogsNav,
  showWebhooksNav,
  showSsoNav,
  showPermissionsNav,
}: {
  orgSlug: string;
  showBillingNav: boolean;
  showAuditLogsNav: boolean;
  showWebhooksNav: boolean;
  showSsoNav: boolean;
  showPermissionsNav: boolean;
}) {
  const pathname = usePathname();
  const base = `/organizations/${orgSlug}/settings`;
  const generalHref = `${base}/general`;

  const items: { href: string; label: string }[] = [
    { href: generalHref, label: "General" },
    { href: `${base}/team`, label: "Team" },
    { href: `${base}/usage`, label: "Usage" },
  ];

  if (showSsoNav) {
    items.push({ href: `${base}/sso`, label: "SSO" });
  }
  if (showBillingNav) {
    items.push({ href: `${base}/billing`, label: "Billing" });
  }
  if (showAuditLogsNav) {
    items.push({ href: `${base}/audit-logs`, label: "Audit logs" });
  }
  if (showPermissionsNav) {
    items.push({ href: `${base}/permissions`, label: "Permissions" });
  }
  if (showWebhooksNav) {
    items.push({ href: `${base}/webhooks`, label: "Webhooks" });
  }

  return (
    <nav
      aria-label="Settings"
      className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:flex lg:flex-col"
    >
      {items.map(({ href, label }) => {
        const isActive =
          pathname === href || (href !== generalHref && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
