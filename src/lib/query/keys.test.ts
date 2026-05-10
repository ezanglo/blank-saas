import { describe, expect, it } from "vitest";

import { queryKeys } from "./keys";

describe("queryKeys", () => {
  it("builds stable organizations keys", () => {
    expect(queryKeys.organizations.all).toEqual(["organizations"]);
    expect(queryKeys.organizations.list()).toEqual(["organizations", "list"]);
    expect(queryKeys.organizations.detail("acme")).toEqual([
      "organizations",
      "detail",
      "acme",
    ]);
  });

  it("scopes session key", () => {
    expect(queryKeys.session).toEqual(["session"]);
  });

  it("includes filters in auditLogs key identity", () => {
    const f = { action: "x" };
    expect(queryKeys.auditLogs.list("org1", f)).toEqual(["audit-logs", "org1", f]);
  });
});
