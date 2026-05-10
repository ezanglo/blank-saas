export type OrgRole = "owner" | "admin" | "member";

const rank: Record<OrgRole, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function roleRank(role: string | null | undefined): number {
  if (!role || !(role in rank)) return 0;
  return rank[role as OrgRole];
}

/** True if `role` has at least the privileges of `min` (owner > admin > member). */
export function roleAtLeast(role: string | null | undefined, min: OrgRole): boolean {
  return roleRank(role) >= rank[min];
}

/** Organization update (name, slug) — admin or owner in default Better Auth AC. */
export function canUpdateOrganization(role: string | null | undefined): boolean {
  return roleAtLeast(role, "admin");
}

/** Invite / cancel invitation / manage members — admin or owner. */
export function canManageMembers(role: string | null | undefined): boolean {
  return roleAtLeast(role, "admin");
}

/** Delete organization — owner only in default Better Auth AC. */
export function canDeleteOrganization(role: string | null | undefined): boolean {
  return role === "owner";
}
