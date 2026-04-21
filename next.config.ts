import type { NextConfig } from "next";

const hasExplicitBackendBaseUrl = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
const backendBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/+$/, "");

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
    if (!hasExplicitBackendBaseUrl) {
      return [];
    }

    return [
      {
        source: "/api/banking/:path*",
        destination: `${bankingBaseUrl}/:path*`,
      },
      {
        source: "/api/core/:path*",
        destination: `${coreBaseUrl}/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
