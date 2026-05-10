/**
 * Active org id from Better Auth session payload (`getSession()` / session query data).
 */
export function activeOrganizationIdFromSession(
  data:
    | {
        session?: {
          activeOrganizationId?: string | null;
          activeOrganization?: string | null;
        };
      }
    | null
    | undefined,
): string | null {
  const inner = data?.session;
  if (!inner) return null;
  return inner.activeOrganizationId ?? inner.activeOrganization ?? null;
}
