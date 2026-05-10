import { describe, expect, it } from "vitest";

import { orgSsoProviderId } from "@/lib/sso/org-sso-provider-id";

describe("orgSsoProviderId", () => {
  it("prefixes organization uuid", () => {
    expect(orgSsoProviderId("550e8400-e29b-41d4-a716-446655440000")).toBe(
      "sso-550e8400-e29b-41d4-a716-446655440000",
    );
  });
});
