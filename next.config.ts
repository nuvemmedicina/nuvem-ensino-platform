import { withSentryConfig } from "@sentry/nextjs";
import createNextIntlPlugin from "next-intl/plugin";
import type { NextConfig } from "next";
import path from "path";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
};

const hasSentryToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

const configWithIntl = withNextIntl(nextConfig);

export default hasSentryToken
  ? withSentryConfig(configWithIntl, {
      org: "nuvem-ensino",
      project: "javascript-nextjs",
      silent: !process.env.CI,
      widenClientFileUpload: true,
      webpack: {
        automaticVercelMonitors: true,
        treeshake: {
          removeDebugLogging: true,
        },
      },
    })
  : configWithIntl;
