import * as Sentry from "@sentry/nextjs";

export async function register() {
  // Sentry tem incompatibilidade com Turbopack em desenvolvimento
  // Só inicializa em produção para evitar o crash do require-in-the-middle
  if (process.env.NODE_ENV === "development") return;

  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
