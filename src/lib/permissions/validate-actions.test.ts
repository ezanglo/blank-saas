import { describe, expect, it } from "vitest";

import { validateGrantActions } from "./validate-actions";

describe("validateGrantActions", () => {
  it("accepts subset for known resource type", () => {
    expect(() => validateGrantActions("project", ["read"])).not.toThrow();
  });

  it("rejects invalid action for known type", () => {
    expect(() => validateGrantActions("project", ["nope"])).toThrow(/not valid/);
  });

  it("accepts snake_case for custom type", () => {
    expect(() => validateGrantActions("folder", ["read", "share"])).not.toThrow();
  });
});
