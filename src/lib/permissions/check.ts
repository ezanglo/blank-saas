/**
 * PRD §32 — granular checks. Product code should call `resolveResourceAccess` (RBAC first),
 * or compose: if (!rbacAllows) await checkPermission(...).
 */
import config from "@payload-config";
import type { Where } from "payload";
import { getPayload } from "payload";

import type { CheckPermissionParams } from "@/lib/permissions/types";
import { normalizePermissionActions } from "@/lib/permissions/normalize-actions";

export function permissionCheckWhere(params: CheckPermissionParams): Where {
  const nowIso = new Date().toISOString();

  const subjectOr: Where[] = [
    {
      and: [
        { subjectType: { equals: "user" } },
        { subjectId: { equals: params.userId } },
      ],
    },
  ];
  if (params.userRole) {
    subjectOr.push({
      and: [
        { subjectType: { equals: "org_role" } },
        { subjectId: { equals: params.userRole } },
      ],
    });
  }

  const and: Where[] = [
    { organization: { equals: params.orgId } },
    { resourceType: { equals: params.resourceType } },
    {
      or: [{ resourceId: { equals: params.resourceId } }, { resourceId: { equals: "*" } }],
    },
    {
      or: [{ expiresAt: { equals: null } }, { expiresAt: { greater_than: nowIso } }],
    },
    { or: subjectOr },
  ];

  return { and };
}

/** Granular layer only (no RBAC). See `resolveResourceAccess` for §32.8 ordering. */
export async function checkPermission(params: CheckPermissionParams): Promise<{ allowed: boolean }> {
  const payload = await getPayload({ config });
  const result = await payload.find({
    collection: "permissions",
    where: permissionCheckWhere(params),
    limit: 50,
    overrideAccess: true,
  });

  const allowed = result.docs.some((doc) =>
    normalizePermissionActions(doc.actions).includes(params.action),
  );
  return { allowed };
}

/** §32.8: RBAC short-circuit, then granular `checkPermission`. */
export async function resolveResourceAccess(params: {
  rbacAllows: boolean;
  granular: () => Promise<{ allowed: boolean }>;
}): Promise<{ allowed: boolean }> {
  if (params.rbacAllows) return { allowed: true };
  return params.granular();
}
