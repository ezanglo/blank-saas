import { ForbiddenError } from "@/lib/auth/require-org";
import { checkPermission, resolveResourceAccess } from "@/lib/permissions/check";
import { isGranularPermissionsEnabled } from "@/lib/permissions/feature";

const TEAM_UI_ACTIONS = ["invite", "manage_roles", "remove_member"] as const;

/** §32.8: RBAC wins when true; otherwise Payload `permissions` rows may allow access (feature-flagged). */
export async function orgScopedAllows(params: {
  organizationId: string;
  userId: string;
  userRole: string | null;
  rbacAllows: boolean;
  resourceType: string;
  action: string;
}): Promise<boolean> {
  if (!isGranularPermissionsEnabled()) {
    return params.rbacAllows;
  }
  const { allowed } = await resolveResourceAccess({
    rbacAllows: params.rbacAllows,
    granular: () =>
      checkPermission({
        orgId: params.organizationId,
        userId: params.userId,
        userRole: params.userRole,
        resourceType: params.resourceType,
        resourceId: params.organizationId,
        action: params.action,
      }),
  });
  return allowed;
}

export async function assertOrgScopedAccess(
  params: Parameters<typeof orgScopedAllows>[0],
): Promise<void> {
  if (!(await orgScopedAllows(params))) {
    throw new ForbiddenError();
  }
}

/** True if any team-management capability is delegated via `org_team` (invite / roles / remove). */
export async function canManageOrgTeamViaGranular(params: {
  organizationId: string;
  userId: string;
  userRole: string | null;
}): Promise<boolean> {
  if (!isGranularPermissionsEnabled()) return false;
  for (const action of TEAM_UI_ACTIONS) {
    const { allowed } = await resolveResourceAccess({
      rbacAllows: false,
      granular: () =>
        checkPermission({
          orgId: params.organizationId,
          userId: params.userId,
          userRole: params.userRole,
          resourceType: "org_team",
          resourceId: params.organizationId,
          action,
        }),
    });
    if (allowed) return true;
  }
  return false;
}
