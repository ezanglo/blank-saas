/** Stable `@better-auth/sso` provider id for an organization row (registerSSOProvider). */
export function orgSsoProviderId(organizationId: string): string {
  return `sso-${organizationId}`;
}
