/** Public app origin for client-side calls to `/api/auth/*` (no trailing slash). */
export function getPublicAppOrigin() {
  return (
    process.env.NEXT_PUBLIC_BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    ""
  ).replace(/\/$/, "");
}

export function authApiUrl(path: string) {
  const origin = getPublicAppOrigin();
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!origin) {
    return `/api/auth${p}`;
  }
  return `${origin}/api/auth${p}`;
}
