/**
 * PostHog event names (PRD §30.5). Single source for instrumentation + tests.
 *
 * Phase 9: emit {@link SSO_LOGIN} from the better-auth SAML callback.
 */
export const ORG_CREATED = "org_created";
export const ORG_DELETED = "org_deleted";
export const MEMBER_INVITED = "member_invited";
export const PLAN_UPGRADED = "plan_upgraded";
export const PLAN_DOWNGRADED = "plan_downgraded";
export const FEATURE_FLAG_EVALUATED = "feature_flag_evaluated";
export const QUOTA_EXCEEDED = "quota_exceeded";
/** Phase 9 — SAML; wire in SAML callback only. */
export const SSO_LOGIN = "sso_login";

export const PAGEVIEW = "$pageview";
