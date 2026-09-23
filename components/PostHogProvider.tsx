"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider, usePostHog } from "posthog-js/react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useSyncExternalStore, Suspense } from "react";
import { APP_URL } from "@/lib/appUrl";
import { sanitizePathAndSearch } from "@/lib/analyticsSanitize";
import { CONSENT_EVENT, getStoredConsent } from "@/lib/consent";

function subscribeToConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

function getConsentSnapshot() {
  return getStoredConsent();
}

function getServerConsentSnapshot() {
  return null;
}

function initPostHogIfNeeded() {
  if (typeof window === "undefined") return;
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

  if (key && !posthog.__loaded) {
    posthog.init(key, {
      api_host: host,
      ui_host: "https://eu.posthog.com",
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

// Rastreia mudanças de página no App Router, só depois de consentimento e
// com a URL sanitizada (sem parâmetros que não sejam de origem, e sem
// nenhum parâmetro em rotas sensíveis como dashboard, checkout e login).
function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (!ph) return;
    const sanitizedPath = sanitizePathAndSearch(pathname, searchParams.toString());
    ph.capture("$pageview", { $current_url: `${APP_URL}${sanitizedPath}` });
  }, [pathname, searchParams, ph]);

  return null;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const consentGranted = consent === "granted";

  useEffect(() => {
    if (consentGranted) initPostHogIfNeeded();
  }, [consentGranted]);

  return (
    <PHProvider client={posthog}>
      {consentGranted && (
        <Suspense fallback={null}>
          <PageViewTracker />
        </Suspense>
      )}
      {children}
    </PHProvider>
  );
}
