import { PostHog } from "posthog-node";

// Singleton server-side para eventos de backend
let _client: PostHog | null = null;

export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

  if (!key) return null; // silencia se não configurado

  if (!_client) {
    _client = new PostHog(key, {
      host,
      flushAt: 1,       // envia imediatamente (serverless)
      flushInterval: 0,
    });
  }
  return _client;
}

// Helper tipado para eventos do servidor
export async function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const ph = getPostHogServer();
  if (!ph) return;
  ph.capture({ distinctId, event, properties });
  await ph.flush();
}
