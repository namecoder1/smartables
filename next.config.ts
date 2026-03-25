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
  // Upload source maps only during CI/production builds
  silent: !process.env.CI,
  // Hides source maps from the client bundle (they're uploaded to Sentry)
  sourcemaps: { disable: true },
  // Suppress Sentry's own debug logs in production
  disableLogger: true,
  // Widens the client file upload to include all JS files
  widenClientFileUpload: true,
  // Disable automatic Vercel Cron monitor creation (we manage uptime manually)
  automaticVercelMonitors: false,
});
