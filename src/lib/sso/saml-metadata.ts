/**
 * SAML IdP metadata helpers (Better Auth `@better-auth/sso` stores XML as `idpMetadata.metadata`).
 */

const ENTITY_ID_RE = /entityID\s*=\s*["']([^"']+)["']/i;

export function normalizeEmailDomain(emailOrDomain: string): string | null {
  const trimmed = emailOrDomain.trim().toLowerCase();
  if (!trimmed) return null;
  if (trimmed.includes("@")) {
    const domain = trimmed.split("@")[1]?.trim();
    return domain || null;
  }
  return trimmed;
}

export function extractEntityIdFromMetadataXml(xml: string): string | null {
  const m = xml.match(ENTITY_ID_RE);
  const raw = m?.[1]?.trim();
  return raw || null;
}

/** Prefer a real https issuer URL for Better Auth (`issuer` must pass URL validation). */
export function resolveSamlIssuer(metadataXml: string, fallbackDomain: string): string {
  const entityId = extractEntityIdFromMetadataXml(metadataXml);
  if (entityId) {
    try {
      const u = new URL(entityId);
      if (u.protocol === "http:" || u.protocol === "https:") return entityId;
    } catch {
      // urn:... entity IDs fall through
    }
    if (/^https?:\/\//i.test(entityId)) return entityId;
  }
  const domain = normalizeEmailDomain(fallbackDomain);
  return domain ? `https://sso.${domain}/metadata` : "https://sso.invalid/metadata";
}

export function guessIdpDisplayName(metadataXml: string, issuerUrl: string): string {
  const entityId = extractEntityIdFromMetadataXml(metadataXml);
  if (entityId) {
    try {
      if (/^https?:\/\//i.test(entityId)) return new URL(entityId).hostname;
      const colon = entityId.lastIndexOf(":");
      if (colon > 0 && colon < entityId.length - 1) return entityId.slice(colon + 1);
      return entityId.slice(0, 80);
    } catch {
      return entityId.slice(0, 80);
    }
  }
  try {
    return new URL(issuerUrl).hostname;
  } catch {
    return issuerUrl.slice(0, 80);
  }
}

export async function fetchIdpMetadataXml(metadataUrl: string): Promise<string> {
  const trimmed = metadataUrl.trim();
  const url = new URL(trimmed);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("Metadata URL must use http or https");
  }
  if (url.protocol === "http:" && process.env.NODE_ENV === "production") {
    throw new Error("Metadata URL must use https in production");
  }
  const res = await fetch(url.toString(), {
    redirect: "follow",
    headers: { Accept: "application/xml,text/xml,*/*" },
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch SAML metadata (${res.status})`);
  }
  const text = await res.text();
  if (!text.includes("<")) {
    throw new Error("Metadata response does not look like XML");
  }
  return text;
}
