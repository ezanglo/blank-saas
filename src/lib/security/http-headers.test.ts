import { describe, expect, it } from "vitest";

import { contentSecurityPolicyDirectives } from "./http-headers";

describe("contentSecurityPolicyDirectives", () => {
  it("adds wasm-unsafe-eval and blob frame-src for Payload admin override", () => {
    const global = contentSecurityPolicyDirectives();
    const admin = contentSecurityPolicyDirectives({ payloadAdmin: true });

    expect(global).not.toContain("wasm-unsafe-eval");
    expect(global).not.toContain("frame-src 'self' blob:");

    expect(admin).toContain("wasm-unsafe-eval");
    expect(admin).toMatch(/frame-src[^;]+blob:/);
  });
});
