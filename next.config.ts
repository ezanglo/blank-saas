import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "9000" },
      { protocol: "https", hostname: "*.s3.amazonaws.com" },
      { protocol: "https", hostname: "*.s3.*.amazonaws.com" },
    ],
  },
  serverExternalPackages: ["better-auth"],
  transpilePackages: ["@react-email/components"],
};

export default nextConfig;
