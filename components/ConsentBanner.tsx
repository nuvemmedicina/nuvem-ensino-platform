"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CONSENT_EVENT, getStoredConsent, setConsent } from "@/lib/consent";

function subscribeToConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

function getConsentSnapshot() {
  return getStoredConsent();
}

function getServerConsentSnapshot() {
  return null; // servidor não conhece o localStorage do visitante
}

// Texto pendente de revisão jurídica: redigido para ser simples e direto,
// sem jargão e sem promessa, mas não substitui uma checagem por quem cuida
// da parte legal da LGPD para o site.
export default function ConsentBanner() {
  const t = useTranslations("consent");
  const consent = useSyncExternalStore(
    subscribeToConsent,
    getConsentSnapshot,
    getServerConsentSnapshot
  );
  const visible = consent === null;

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label={t("message")}
      className="fixed bottom-0 inset-x-0 z-50 bg-canvas-light text-white border-t border-white/10"
    >
      <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
        <p className="font-sans text-xs text-white/70 leading-relaxed flex-1">
          {t("message")}{" "}
          <Link href="/privacidade" className="underline hover:text-white transition-colors">
            {t("privacyLink")}
          </Link>
        </p>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setConsent("denied")}
            className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-white/30 text-white/80 hover:border-white/60 transition-colors"
          >
            {t("decline")}
          </button>
          <button
            type="button"
            onClick={() => setConsent("granted")}
            className="font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            {t("accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
