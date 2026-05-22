import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
};

const configWithIntl = withNextIntl(nextConfig);

// Only wrap with Sentry when the auth token is present (CI / Vercel with SENTRY_AUTH_TOKEN set)
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(configWithIntl, {
      org: "nuvem-ensino",
      project: "javascript-nextjs",
      silent: true,
      widenClientFileUpload: true,
      automaticVercelMonitors: true,
    })
  : configWithIntl;
