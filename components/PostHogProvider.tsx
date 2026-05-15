"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";

// Rastreia mudanças de página no App Router
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    ph.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams, ph]);

  return null;
}

// Inicializa PostHog uma única vez no browser
if (typeof window !== "undefined") {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com";

  if (key && !posthog.__loaded) {
    posthog.init(key, {
      api_host: host,
      ui_host: "https://us.posthog.com",
      capture_pageview: false,       // controlamos manualmente via PageViewTracker
      capture_pageleave: true,
      persistence: "localStorage+cookie",
      respect_dnt: true,             // respeita Do Not Track (LGPD)
      session_recording: {
        maskAllInputs: true,         // não grava campos de input (LGPD)
        maskTextSelector: "[data-ph-no-capture]",
      },
      loaded: (ph) => {
        if (process.env.NODE_ENV !== "production") {
          ph.debug(); // logs no console em dev
        }
      },
    });
  }
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <PHProvider client={posthog}>
      <Suspense fallback={null}>
        <PageViewTracker />
      </Suspense>
      {children}
    </PHProvider>
  );
}
