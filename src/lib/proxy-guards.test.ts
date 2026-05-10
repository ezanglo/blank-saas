import { describe, expect, it } from "vitest";

import {
  isProtectedProductPath,
  parseOrganizationSlugSegment,
  sessionActiveOrg,
} from "./proxy-guards";

describe("isProtectedProductPath", () => {
  it("matches dashboard and org routes", () => {
    expect(isProtectedProductPath("/dashboard")).toBe(true);
    expect(isProtectedProductPath("/organizations/acme")).toBe(true);
    expect(isProtectedProductPath("/account")).toBe(true);
    expect(isProtectedProductPath("/settings/profile")).toBe(true);
  });

  it("does not match marketing or auth-only paths", () => {
    expect(isProtectedProductPath("/")).toBe(false);
    expect(isProtectedProductPath("/sign-in")).toBe(false);
    expect(isProtectedProductPath("/admin")).toBe(false);
  });
});

describe("parseOrganizationSlugSegment", () => {
  it("extracts slug", () => {
    expect(parseOrganizationSlugSegment("/organizations/acme")).toBe("acme");
    expect(parseOrganizationSlugSegment("/organizations/acme/settings")).toBe("acme");
  });

  it("returns null when not an org path", () => {
    expect(parseOrganizationSlugSegment("/dashboard")).toBeNull();
  });
});

describe("sessionActiveOrg", () => {
  it("prefers activeOrganizationId", () => {
    expect(
      sessionActiveOrg({
        session: { activeOrganizationId: "u1", activeOrganization: "u2" },
      }),
    ).toBe("u1");
  });

  it("falls back to activeOrganization", () => {
    expect(sessionActiveOrg({ session: { activeOrganization: "x" } })).toBe("x");
  });

  it("returns null when unset", () => {
    expect(sessionActiveOrg({ session: {} })).toBeNull();
  });
});
