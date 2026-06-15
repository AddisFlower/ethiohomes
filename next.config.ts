import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  reactCompiler: true,
};

export default nextConfig;
