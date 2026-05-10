import { describe, expect, it } from "vitest";

import {
  emailSchema,
  forgotPasswordSchema,
  passwordSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/auth/schemas";

describe("passwordSchema", () => {
  it("accepts 8+ characters", () => {
    expect(passwordSchema.safeParse("abcdefgh").success).toBe(true);
  });

  it("rejects short passwords", () => {
    expect(passwordSchema.safeParse("short").success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("accepts valid email", () => {
    expect(emailSchema.safeParse("a@b.co").success).toBe(true);
  });

  it("rejects invalid email", () => {
    expect(emailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("signInSchema", () => {
  it("requires password present", () => {
    expect(
      signInSchema.safeParse({ email: "u@example.com", password: "" })
        .success,
    ).toBe(false);
  });
});

describe("signUpSchema", () => {
  it("requires matching passwords", () => {
    const r = signUpSchema.safeParse({
      name: "Test",
      email: "u@example.com",
      password: "password1",
      confirmPassword: "password2",
    });
    expect(r.success).toBe(false);
  });

  it("accepts when passwords match", () => {
    const r = signUpSchema.safeParse({
      name: "Test",
      email: "u@example.com",
      password: "password1",
      confirmPassword: "password1",
    });
    expect(r.success).toBe(true);
  });
});

describe("forgotPasswordSchema", () => {
  it("parses email", () => {
    expect(
      forgotPasswordSchema.safeParse({ email: "u@example.com" }).success,
    ).toBe(true);
  });
});

describe("resetPasswordSchema", () => {
  it("requires matching new passwords", () => {
    const r = resetPasswordSchema.safeParse({
      password: "newpass1",
      confirmPassword: "newpass2",
    });
    expect(r.success).toBe(false);
  });
});
