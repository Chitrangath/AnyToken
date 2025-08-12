import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'export',
  distDir: 'out',
  images: {
    unoptimized: true,
  },
  basePath: "",
  assetPrefix: "./",
  trailingStash: true,
};

export default nextConfig;
