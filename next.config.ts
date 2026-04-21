import type { NextConfig } from "next";

const rawBackendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";
const backendBaseUrl = rawBackendBaseUrl.replace(/\/+$/, "");

const hasExplicitBackendBaseUrl = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

const bankingBaseUrl = !hasExplicitBackendBaseUrl
  ? "/banking"
  : backendBaseUrl.endsWith("/banking")
    ? backendBaseUrl
    : `${backendBaseUrl}/banking`;

const coreBaseUrl = !hasExplicitBackendBaseUrl
  ? "/core"
  : backendBaseUrl.endsWith("/banking")
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
        destination: hasExplicitBackendBaseUrl ? `${backendBaseUrl}/:path*` : "/:path*",
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
