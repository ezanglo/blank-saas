"use client";

import { useQuery } from "@tanstack/react-query";

import { authApiUrl } from "@/lib/auth/app-url";
import { authClient } from "@/lib/auth-client";
import { activeOrganizationIdFromSession } from "@/lib/org/session-active-org";

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
  return useQuery({
    queryKey: queryKeys.organizations.list(),
    queryFn: async () => {
      const url = authApiUrl("/organization/list");
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load organizations");
      return res.json() as Promise<
        { id: string; name: string; slug: string; logo?: string | null }[]
      >;
    },
  });
}

/** Active org from session + list (fallback: sole membership). Session query must be warmed. */
export function useActiveOrganization() {
  const { data: sessionData, isLoading: sessionLoading } = useSessionQuery();
  const { data: orgs, isLoading: orgsLoading } = useOrganizations();
  const id = activeOrganizationIdFromSession(sessionData);
  const organization =
    orgs?.find((o) => o.id === id) ?? (orgs?.length === 1 ? orgs[0] : undefined);
  return {
    organization,
    organizationId: organization?.id ?? null,
    slug: organization?.slug ?? null,
    isLoading: sessionLoading || orgsLoading,
  };
}

export type OrganizationMemberRow = {
  id: string;
  userId: string;
  organizationId: string;
  role: string;
  createdAt: string;
  user?: {
    id: string;
    email: string;
    name: string;
    image?: string | null;
  };
};

export function useOrganizationMembers(orgId: string | undefined) {
  return useQuery({
    queryKey: orgId ? queryKeys.members.list(orgId) : ["members", "list", "none"],
    queryFn: async () => {
      if (!orgId) return { members: [] as OrganizationMemberRow[], total: 0 };
      const url = `${authApiUrl("/organization/list-members")}?organizationId=${encodeURIComponent(orgId)}`;
      const res = await fetch(url, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load members");
      const data = (await res.json()) as {
        members: OrganizationMemberRow[];
        total: number;
      };
      return data;
    },
    enabled: Boolean(orgId),
  });
}

export type OrgInvitationRow = {
  id: string;
  email: string;
  role: string;
  organizationId: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export function useOrgInvitations(orgId: string | undefined) {
  return useQuery({
    queryKey: orgId ? queryKeys.invitations.list(orgId) : ["invitations", "none"],
    queryFn: async () => {
      if (!orgId) return [] as OrgInvitationRow[];
      const url = `${authApiUrl("/organization/list-invitations")}?organizationId=${encodeURIComponent(orgId)}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load invitations");
      return res.json() as Promise<OrgInvitationRow[]>;
    },
    enabled: Boolean(orgId),
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
