import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sonizywznazqmnbxwubw.supabase.co'
      },
      {
        protocol: 'https',
        hostname: 'pps.whatsapp.net'
      },
      {
        protocol: 'https',
        hostname: 'cdn.sanity.io'
      },
    ]
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  sourcemaps: { disable: true },
  disableLogger: true,
  widenClientFileUpload: true,
  automaticVercelMonitors: false,
});
