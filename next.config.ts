import type { NextConfig } from "next";

const rawBackendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
const backendBaseUrl = rawBackendBaseUrl.replace(/\/+$/, "");

const bankingBaseUrl = backendBaseUrl.endsWith("/banking")
  ? backendBaseUrl
  : `${backendBaseUrl}/banking`;

const coreBaseUrl = backendBaseUrl.endsWith("/banking")
  ? backendBaseUrl.replace(/\/banking$/, "/core")
  : backendBaseUrl.endsWith("/core")
    ? backendBaseUrl
    : `${backendBaseUrl}/core`;

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/banking/:path*",
        destination: `${bankingBaseUrl}/:path*`,
      },
      {
        source: "/api/core/:path*",
        destination: `${coreBaseUrl}/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendBaseUrl}/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
