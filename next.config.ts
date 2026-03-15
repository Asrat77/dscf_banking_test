import type { NextConfig } from "next";

const backendBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/banking/:path*",
        destination: `${backendBaseUrl}/banking/:path*`,
      },
      {
        source: "/api/core/:path*",
        destination: `${backendBaseUrl}/core/:path*`,
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
