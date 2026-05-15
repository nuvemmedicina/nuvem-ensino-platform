// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
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
