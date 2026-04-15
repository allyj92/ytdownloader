import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/:path*", // Strip /api when sending to local server
      },
    ];
  },
};

export default nextConfig;
