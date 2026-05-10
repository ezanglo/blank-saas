export type ResponseHeader = { key: string; value: string };

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "") || url;
}

/** PostHog ingest origin(s) for CSP connect-src / script-src — driven by public env at build time. */
export function posthogCspOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_POSTHOG_HOST?.trim();
  if (!raw) return "https://app.posthog.com";
  try {
    const u = new URL(raw.startsWith("http") ? raw : `https://${raw}`);
    return trimTrailingSlash(`${u.protocol}//${u.host}`);
  } catch {
    return "https://app.posthog.com";
  }
}

/** Baseline CSP candidates for iteration (report-only first). Keep in sync with docs/runbooks/csp-matrix.md */
export function contentSecurityPolicyDirectives(
  options: { payloadAdmin?: boolean } = {},
): string {
  const { payloadAdmin = false } = options;
  const posthog = posthogCspOrigin();
  const frameSrc = payloadAdmin
    ? `'self' blob: https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://billing.stripe.com https://connect.stripe.com`
    : `'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com https://billing.stripe.com https://connect.stripe.com`;
  const scriptSrcExtras = payloadAdmin ? " 'wasm-unsafe-eval'" : "";
  const directives = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    `form-action 'self' https://checkout.stripe.com https://billing.stripe.com`,
    `frame-src ${frameSrc}`,
    `script-src 'self' 'unsafe-inline' 'unsafe-eval'${scriptSrcExtras} https://js.stripe.com https://*.stripe.com ${posthog}`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data: blob: https:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://api.stripe.com https://*.stripe.com https://*.stripe.network ${posthog} https://*.ingest.us.sentry.io https://*.ingest.de.sentry.io https://*.ingest.sentry.io`,
    "worker-src 'self' blob:",
    "manifest-src 'self'",
  ];
  return directives.join("; ");
}

export type BaselineSecurityOptions = { payloadAdmin?: boolean };

function staticSecurityHeaders(): ResponseHeader[] {
  const headers: ResponseHeader[] = [
    { key: "X-Content-Type-Options", value: "nosniff" },
    { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
    {
      key: "Permissions-Policy",
      value:
        "camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)",
    },
    { key: "X-Frame-Options", value: "SAMEORIGIN" },
  ];

  if (process.env.SECURITY_ENABLE_HSTS === "true") {
    headers.push({
      key: "Strict-Transport-Security",
      value: "max-age=31536000; includeSubDomains; preload",
    });
  }

  return headers;
}

/** CSP / CSP-Report-Only entries only (for merging with static headers and route overrides). */
export function cspSecurityHeaders(
  options: BaselineSecurityOptions = {},
): ResponseHeader[] {
  const csp = contentSecurityPolicyDirectives(options);
  if (process.env.SECURITY_CSP_ENFORCE === "true") {
    return [{ key: "Content-Security-Policy", value: csp }];
  }
  if (process.env.SECURITY_CSP_REPORT_ONLY === "true") {
    return [
      {
        key: "Content-Security-Policy-Report-Only",
        value: csp,
      },
    ];
  }
  return [];
}

export function baselineSecurityHeaders(
  options: BaselineSecurityOptions = {},
): ResponseHeader[] {
  return [...staticSecurityHeaders(), ...cspSecurityHeaders(options)];
}

/**
 * Next.js `headers()` export shape. Global `/:path*` sets static headers + default CSP.
 * `/admin/:path*` adds **only** a Payload-oriented CSP so merged responses override the global
 * `Content-Security-Policy` for admin (same static headers, no duplication).
 */
export function securityHeadersConfig(): {
  source: string;
  headers: ResponseHeader[];
}[] {
  const base = [...staticSecurityHeaders(), ...cspSecurityHeaders({})];
  const out: { source: string; headers: ResponseHeader[] }[] = [
    { source: "/:path*", headers: base },
  ];
  if (
    process.env.SECURITY_CSP_ENFORCE === "true" ||
    process.env.SECURITY_CSP_REPORT_ONLY === "true"
  ) {
    out.push({
      source: "/admin/:path*",
      headers: cspSecurityHeaders({ payloadAdmin: true }),
    });
  }
  return out;
}
