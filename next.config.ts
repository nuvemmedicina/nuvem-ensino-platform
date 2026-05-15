import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  org: "nuvem-ensino",
  project: "javascript-nextjs",

  // Só exibe logs em CI
  silent: !process.env.CI,

  // Upload de source maps só quando SENTRY_AUTH_TOKEN estiver configurado
  sourcemaps: {
    disable: !process.env.SENTRY_AUTH_TOKEN,
  },

  widenClientFileUpload: true,

  webpack: {
    automaticVercelMonitors: true,
    treeshake: {
      removeDebugLogging: true,
    },
  },
});
