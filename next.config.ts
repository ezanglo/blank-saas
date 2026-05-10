import { withPayload } from "@payloadcms/next/withPayload";
import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

import { securityHeadersConfig } from "./src/lib/security/http-headers";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    ],
  },
  serverExternalPackages: ["better-auth", "payload"],
  transpilePackages: ["@react-email/components"],
  async headers() {
    return securityHeadersConfig();
  },
};

export default withSentryConfig(withPayload(nextConfig), {
  silent: true,
  sourcemaps: {
    disable:
      process.env.SENTRY_UPLOAD_SOURCEMAPS === "true" || process.env.SENTRY_AUTH_TOKEN
        ? false
        : true,
  },
  webpack: {
    excludeServerRoutes: ["/api/webhooks/stripe", "/api/webhooks/svix"],
  },
  tunnelRoute:
    process.env.SENTRY_TUNNEL_ROUTE === "auto"
      ? true
      : process.env.SENTRY_TUNNEL_ROUTE?.trim() || undefined,
});
