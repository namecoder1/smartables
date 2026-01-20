import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sonizywznazqmnbxwubw.supabase.co'
      }
    ]
  }
};

export default nextConfig;
