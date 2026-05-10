/** Opt-in granular ACL (PRD §32). When false, RBAC-only forks see no permissions UI and server actions reject. */
export function isGranularPermissionsEnabled(): boolean {
  const v = process.env.NEXT_PUBLIC_FEATURE_GRANULAR_PERMISSIONS;
  return v === "true" || v === "1";
}
