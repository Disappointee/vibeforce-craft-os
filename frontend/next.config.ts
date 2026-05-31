import type { NextConfig } from "next";

const isProduction = process.env.NODE_ENV === 'production';

const nextConfig: NextConfig = {
  ...(isProduction ? { output: 'standalone' } : {}),

  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
