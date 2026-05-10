import { describe, expect, it } from "vitest";

import {
  canDeleteOrganization,
  canManageMembers,
  canUpdateOrganization,
  roleAtLeast,
  roleRank,
} from "@/lib/auth/rbac";

describe("roleRank / roleAtLeast", () => {
  it("ranks roles", () => {
    expect(roleRank("member")).toBeLessThan(roleRank("admin"));
    expect(roleRank("admin")).toBeLessThan(roleRank("owner"));
  });

  it("returns 0 for unknown", () => {
    expect(roleRank(null)).toBe(0);
    expect(roleRank("")).toBe(0);
    expect(roleRank("superuser")).toBe(0);
  });

  it("checks minimum role", () => {
    expect(roleAtLeast("member", "member")).toBe(true);
    expect(roleAtLeast("member", "admin")).toBe(false);
    expect(roleAtLeast("owner", "admin")).toBe(true);
  });
});

describe("capabilities vs default BA matrix", () => {
  it("member cannot update org settings or invite", () => {
    expect(canUpdateOrganization("member")).toBe(false);
    expect(canManageMembers("member")).toBe(false);
    expect(canDeleteOrganization("member")).toBe(false);
  });

  it("admin can update org and manage members but not delete org", () => {
    expect(canUpdateOrganization("admin")).toBe(true);
    expect(canManageMembers("admin")).toBe(true);
    expect(canDeleteOrganization("admin")).toBe(false);
  });

  it("owner can manage org lifecycle", () => {
    expect(canUpdateOrganization("owner")).toBe(true);
    expect(canManageMembers("owner")).toBe(true);
    expect(canDeleteOrganization("owner")).toBe(true);
  });
});
