import { describe, expect, it } from "vitest";

import {
  extractEntityIdFromMetadataXml,
  normalizeEmailDomain,
  resolveSamlIssuer,
} from "@/lib/sso/saml-metadata";

describe("normalizeEmailDomain", () => {
  it("extracts domain from email", () => {
    expect(normalizeEmailDomain("User@Example.COM")).toBe("example.com");
  });

  it("accepts bare domain", () => {
    expect(normalizeEmailDomain(" Example.com ")).toBe("example.com");
  });

  it("returns null for empty", () => {
    expect(normalizeEmailDomain("")).toBeNull();
    expect(normalizeEmailDomain("   ")).toBeNull();
  });
});

describe("extractEntityIdFromMetadataXml", () => {
  it("reads entityID attribute", () => {
    const xml = `<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata" entityID="https://idp.example.com/metadata">`;
    expect(extractEntityIdFromMetadataXml(xml)).toBe("https://idp.example.com/metadata");
  });
});

describe("resolveSamlIssuer", () => {
  it("uses https entityID when present", () => {
    const xml = `<EntityDescriptor entityID="https://acme.okta.com/app/xxx/sso/saml/metadata"/>`;
    expect(resolveSamlIssuer(xml, "example.com")).toBe(
      "https://acme.okta.com/app/xxx/sso/saml/metadata",
    );
  });

  it("falls back to synthetic issuer for urn entity IDs", () => {
    const xml = `<EntityDescriptor entityID="urn:example:idp:123"/>`;
    expect(resolveSamlIssuer(xml, "corp.io")).toBe("https://sso.corp.io/metadata");
  });
});
