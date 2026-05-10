import { describe, expect, it } from "vitest";

import {
  FEATURE_FLAG_EVALUATED,
  MEMBER_INVITED,
  ORG_CREATED,
  ORG_DELETED,
  PAGEVIEW,
  PLAN_DOWNGRADED,
  PLAN_UPGRADED,
  QUOTA_EXCEEDED,
  SSO_LOGIN,
} from "./events";

describe("analytics event names (PRD §30.5)", () => {
  it("exports stable custom event strings", () => {
    expect(ORG_CREATED).toBe("org_created");
    expect(ORG_DELETED).toBe("org_deleted");
    expect(MEMBER_INVITED).toBe("member_invited");
    expect(PLAN_UPGRADED).toBe("plan_upgraded");
    expect(PLAN_DOWNGRADED).toBe("plan_downgraded");
    expect(FEATURE_FLAG_EVALUATED).toBe("feature_flag_evaluated");
    expect(QUOTA_EXCEEDED).toBe("quota_exceeded");
    expect(SSO_LOGIN).toBe("sso_login");
    expect(PAGEVIEW).toBe("$pageview");
  });
});
