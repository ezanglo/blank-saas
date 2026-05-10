import type { OrgInvitationRow } from "@/lib/query/hooks";

function parseDate(value: string | Date | null | undefined): Date | null {
  if (value == null) return null;
  const d = typeof value === "string" ? new Date(value) : value;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Pending invite past `expiresAt` — Better Auth often keeps status `pending`. */
export function isOrgInvitationExpired(invitation: OrgInvitationRow): boolean {
  const d = parseDate(invitation.expiresAt ?? null);
  if (!d) return false;
  return d.getTime() <= Date.now();
}

export function orgInvitationStatusBadge(invitation: OrgInvitationRow): {
  label: string;
  variant: "default" | "secondary" | "destructive" | "outline";
} {
  const raw = invitation.status?.toLowerCase() ?? "";
  if (raw === "pending" && isOrgInvitationExpired(invitation)) {
    return { label: "Expired", variant: "destructive" };
  }
  if (raw === "pending") {
    return { label: "Pending", variant: "outline" };
  }
  if (raw === "canceled" || raw === "cancelled") {
    return { label: "Canceled", variant: "secondary" };
  }
  if (raw === "rejected") {
    return { label: "Declined", variant: "secondary" };
  }
  if (raw === "accepted") {
    return { label: "Accepted", variant: "secondary" };
  }
  return {
    label: raw ? raw.charAt(0).toUpperCase() + raw.slice(1) : "Unknown",
    variant: "outline",
  };
}

export function orgInviteAcceptUrl(invitationId: string): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (fromEnv) return `${fromEnv}/invite/${invitationId}`;
  if (typeof window !== "undefined") return `${window.location.origin}/invite/${invitationId}`;
  return "";
}
