import { describe, expect, it } from "vitest";

import { isUniqueConstraintViolation } from "@/lib/billing/stripe-idempotency";

describe("isUniqueConstraintViolation", () => {
  it("detects postgres code 23505", () => {
    expect(isUniqueConstraintViolation({ code: "23505" })).toBe(true);
  });

  it("detects duplicate message", () => {
    expect(isUniqueConstraintViolation(new Error("duplicate key value"))).toBe(true);
    expect(isUniqueConstraintViolation(new Error("unique constraint violated"))).toBe(true);
  });

  it("returns false for other errors", () => {
    expect(isUniqueConstraintViolation(new Error("network"))).toBe(false);
    expect(isUniqueConstraintViolation(null)).toBe(false);
  });
});
