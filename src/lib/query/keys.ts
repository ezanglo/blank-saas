/** Query keys (PRD §18.1). Use with TanStack Query invalidation and hooks. */
export const queryKeys = {
  organizations: {
    all: ["organizations"] as const,
    list: () => [...queryKeys.organizations.all, "list"] as const,
    detail: (slug: string) => [...queryKeys.organizations.all, "detail", slug] as const,
  },
  members: {
    list: (orgId: string) => ["members", "list", orgId] as const,
  },
  invitations: {
    list: (orgId: string) => ["invitations", "list", orgId] as const,
  },
  auditLogs: {
    list: (orgId: string, filters: object) => ["audit-logs", orgId, filters] as const,
  },
  usage: {
    detail: (orgId: string) => ["usage", orgId] as const,
  },
  session: ["session"] as const,
  billing: {
    detail: (orgId: string) => ["billing", orgId] as const,
  },
  permissions: {
    list: (orgId: string, filters?: object) => ["permissions", orgId, filters] as const,
  },
};
