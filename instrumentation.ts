import type { Instrumentation } from "next";

export async function register() {
  // Sentry (via @opentelemetry/instrumentation) trava o dev server em
  // alguns ambientes locais (Node 24+) mesmo sem chamar Sentry.init() —
  // só o `import` do pacote já dispara o require-in-the-middle. Por isso
  // o import do SDK é dinâmico e só acontece fora de development.
  if (process.env.NODE_ENV === "development") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (process.env.NODE_ENV === "development") return;
  const Sentry = await import("@sentry/nextjs");
  return Sentry.captureRequestError(...args);
};
