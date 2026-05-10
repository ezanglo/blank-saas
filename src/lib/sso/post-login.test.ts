import { describe, expect, it } from "vitest";

import { extractSamlProviderIdFromAuthPath } from "@/lib/sso/post-login";

describe("extractSamlProviderIdFromAuthPath", () => {
  it("parses ACS path", () => {
    expect(extractSamlProviderIdFromAuthPath("/sso/saml2/sp/acs/sso-abc")).toBe("sso-abc");
  });

  it("parses callback path", () => {
    expect(extractSamlProviderIdFromAuthPath("/sso/saml2/callback/sso-xyz")).toBe("sso-xyz");
  });

  it("returns null when missing", () => {
    expect(extractSamlProviderIdFromAuthPath("/sign-in/email")).toBeNull();
  });
});
