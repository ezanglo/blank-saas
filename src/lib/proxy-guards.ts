/**
 * Pure helpers for product-route gating — unit-tested without Next.js runtime.
 * Consumed by `src/proxy.ts`.
 */

export function isProtectedProductPath(pathname: string) {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/organizations") ||
    pathname.startsWith("/account") ||
    pathname.startsWith("/invite")
  );
}

/** First path segment after `/organizations/` when present, else null. */
export function parseOrganizationSlugSegment(pathname: string): string | null {
  const orgSeg = pathname.match(/^\/organizations\/([^/]+)/);
  return orgSeg?.[1] ?? null;
}

export function sessionActiveOrg(session: {
  session: Record<string, unknown> | null | undefined;
}): string | null {
  const s = session.session as
    | {
        activeOrganizationId?: string | null;
        activeOrganization?: string | null;
      }
    | null
    | undefined;
  return s?.activeOrganizationId ?? s?.activeOrganization ?? null;
}
