import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

// Só aplica o wrapper do Sentry quando o token estiver presente.
// Sem token, o CLI tentaria criar releases e falharia com 401.
const hasSentryToken = Boolean(process.env.SENTRY_AUTH_TOKEN);

export default hasSentryToken
  ? withSentryConfig(nextConfig, {
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
  : nextConfig;
