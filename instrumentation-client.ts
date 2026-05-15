// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Amostragem de traces: 10% em produção para reduzir custos
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

  // Não enviar dados pessoais (LGPD)
  sendDefaultPii: false,

  // Silenciar em desenvolvimento
  enabled: process.env.NODE_ENV === "production",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
