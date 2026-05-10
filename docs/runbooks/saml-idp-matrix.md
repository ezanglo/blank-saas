# Runbook — SAML IdP smoke matrix

Better Auth serves SAML at **`/api/auth/sso/*`**. Org owners configure providers in **Organization → Settings → SSO**. Optional **BoxyHQ Jackson** runs via Docker Compose (`--profile jackson`).

This document tracks **manual or automated smoke** confidence across common IdPs. It is **not** a guarantee of certification; use it for onboarding checklists.

| IdP | Status | Notes |
|-----|--------|--------|
| **Okta** | Manual smoke recommended | SAML app integration; assert ACS and Entity IDs match `NEXT_PUBLIC_APP_URL` and Better Auth routes. |
| **Microsoft Entra ID (Azure AD)** | Manual smoke recommended | Same as Okta; watch clock skew and certificate rollover. |
| **Generic SAML 2.0** | Supported by Better Auth | Use metadata URL/XML from your IdP; keep Jackson env aligned if using the sidecar. |

## Automated coverage

- Extend Playwright or integration tests when a dedicated SAML test harness is available (credentials are usually not runnable in CI). Until then, keep **staging** verification in [`staging-checklist.md`](staging-checklist.md) under authenticated flows.

## References

- Phase spec: [`docs/prd-v4-phases/phase-09-sso-saml.md`](../prd-v4-phases/phase-09-sso-saml.md)
