"use client";

import { useQuery } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";

import { queryKeys } from "./keys";

/** Session via TanStack Query (invalidate with `queryKeys.session`). */
export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session,
    queryFn: async () => {
      const res = await authClient.getSession();
      if (res.error) throw new Error(res.error.message ?? "Session fetch failed");
      return res.data;
    },
  });
}

/** Lists organizations for the signed-in user (`GET /api/auth/organization/list`). */
export function useOrganizations() {
  const base =
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "";

  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: async () => {
      const url = `${base.replace(/\/$/, "")}/api/auth/organization/list`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load organizations");
      return res.json() as Promise<
        { id: string; name: string; slug: string; logo?: string | null }[]
      >;
    },
  });
}

export function useOrganizationMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: orgId ? queryKeys.members.list(orgId) : ["members", "list", "none"],
    queryFn: async () => {
      if (!orgId) return [];
      const base =
        process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        "";
      const root = `${base.replace(/\/$/, "")}/api/auth`;
      const url = `${root}/organization/list-members?organizationId=${encodeURIComponent(orgId)}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load members");
      return res.json();
    },
    enabled: Boolean(orgId),
  });
}

/** Wire to invitations API in Phase 5+. */
export function useOrgInvitations(orgId: string | undefined) {
  return useQuery({
    queryKey: orgId ? queryKeys.invitations.list(orgId) : ["invitations", "none"],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });
}

/** Wire to audit API in Phase 6+. */
export function useAuditLogs(orgId: string | undefined, filters: object) {
  void filters;
  return useQuery({
    queryKey: orgId ? queryKeys.auditLogs.list(orgId, {}) : ["audit-logs", "none"],
    queryFn: () => Promise.resolve({ items: [], total: 0 }),
    enabled: false,
  });
}

/** Wire to usage counters in Phase 6+. */
export function useOrgUsage(orgId: string | undefined) {
  return useQuery({
    queryKey: orgId ? queryKeys.usage.detail(orgId) : ["usage", "none"],
    queryFn: () => Promise.resolve(null),
    enabled: false,
    refetchInterval: 30_000,
  });
}

/** Wire to Payload billing fields in Phase 7+. */
export function useOrgBilling(orgId: string | undefined) {
  return useQuery({
    queryKey: orgId ? queryKeys.billing.detail(orgId) : ["billing", "none"],
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
}

/** Wire to permissions collection in Phase 10+. */
export function useOrgPermissions(orgId: string | undefined, filters?: object) {
  return useQuery({
    queryKey: orgId ? queryKeys.permissions.list(orgId, filters) : ["permissions", "none"],
    queryFn: () => Promise.resolve([]),
    enabled: false,
  });
}
