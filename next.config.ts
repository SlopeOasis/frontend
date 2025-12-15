import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '10000',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
      },
    ],
  },
};

export default nextConfig;
