import type { NextConfig } from "next";

const nextConfig = {
  experimental: {
    proxyClientMaxBodySize: "50mb",
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
} as NextConfig;

export default nextConfig;
