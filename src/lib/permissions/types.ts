import type { OrgRole } from "@/lib/auth/rbac";

export type ResourceType = "project" | "document" | "api_key" | (string & {});

export const RESOURCE_ACTIONS = {
  project: ["read", "write", "delete", "invite"],
  document: ["read", "comment", "write", "delete"],
  api_key: ["read", "rotate", "delete"],
  /** Org-wide delegation: use organization id as `resourceId`, or `*` in grants. */
  org_team: ["invite", "manage_roles", "remove_member"],
  org_webhooks: ["read", "write", "delete"],
  org_settings: ["write"],
  org_audit_logs: ["read", "export"],
  org_usage: ["read"],
  org_billing: ["read", "manage"],
  org_sso: ["configure"],
  org_permissions: ["read"],
} as const satisfies Record<string, readonly string[]>;

export type KnownResourceType = keyof typeof RESOURCE_ACTIONS;

export const KNOWN_RESOURCE_TYPE_OPTIONS = Object.keys(RESOURCE_ACTIONS) as KnownResourceType[];

export function resourceActionsFor(resourceType: string): readonly string[] | null {
  if (resourceType in RESOURCE_ACTIONS) {
    return RESOURCE_ACTIONS[resourceType as KnownResourceType];
  }
  return null;
}

export type GrantPermissionInput = {
  orgId: string;
  subjectId: string;
  subjectType: "user" | "org_role";
  resourceType: string;
  resourceId: string;
  actions: string[];
  expiresAt?: Date | string | null;
};

export type CheckPermissionParams = {
  orgId: string;
  userId: string;
  /** Member org role — used to match `subjectType: "org_role"` grants. */
  userRole?: OrgRole | string | null;
  resourceType: string;
  resourceId: string;
  action: string;
};
