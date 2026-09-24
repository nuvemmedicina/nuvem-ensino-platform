"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Cookie } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { CONSENT_EVENT, getStoredConsent, setConsent, setAllConsent } from "@/lib/consent";

function subscribeToConsent(callback: () => void) {
  window.addEventListener(CONSENT_EVENT, callback);
  return () => window.removeEventListener(CONSENT_EVENT, callback);
}

function getAnalyticsSnapshot() {
  return getStoredConsent("analytics");
}

function getMarketingSnapshot() {
  return getStoredConsent("marketing");
}

function getServerConsentSnapshot() {
  return null; // servidor não conhece o localStorage do visitante
}

// Texto pendente de revisão jurídica: redigido para ser simples e direto,
// sem jargão e sem promessa, mas não substitui uma checagem por quem cuida
// da parte legal da LGPD para o site.
export default function ConsentBanner() {
  const t = useTranslations("consent");
  const analyticsConsent = useSyncExternalStore(
    subscribeToConsent,
    getAnalyticsSnapshot,
    getServerConsentSnapshot
  );
  const marketingConsent = useSyncExternalStore(
    subscribeToConsent,
    getMarketingSnapshot,
    getServerConsentSnapshot
  );
  // Mostra o banner enquanto qualquer uma das duas categorias ainda não
  // tiver uma escolha registrada, mesmo para quem já respondeu a outra
  // antes (por exemplo, alguém que já tinha aceitado análise, mas nunca viu
  // a categoria de publicidade, precisa decidir sobre ela também).
  const visible = analyticsConsent === null || marketingConsent === null;
  const [expanded, setExpanded] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);

  if (!visible) return null;

  function savePreferences() {
    setConsent("analytics", analyticsEnabled ? "granted" : "denied");
    setConsent("marketing", marketingEnabled ? "granted" : "denied");
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 max-w-md">
      <div className="bg-surface border border-border rounded-2xl shadow-xl p-5">
        <div className="flex items-start gap-3">
          <div className="shrink-0 w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Cookie className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-sans text-sm text-foreground leading-relaxed">
              {t("message")}{" "}
              <Link href="/privacidade" className="font-semibold text-primary hover:underline">
                {t("privacyLink")}
              </Link>
              . {t("noHealthData")}
            </p>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans text-xs font-semibold text-foreground">{t("essentialTitle")}</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">{t("essentialDesc")}</p>
              </div>
              <div className="shrink-0 w-9 h-5 rounded-full bg-primary/30 flex items-center px-0.5 justify-end">
                <span className="w-4 h-4 rounded-full bg-primary block" />
              </div>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans text-xs font-semibold text-foreground">{t("analyticsTitle")}</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">{t("analyticsDesc")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={analyticsEnabled}
                onClick={() => setAnalyticsEnabled((v) => !v)}
                className={`shrink-0 w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                  analyticsEnabled ? "bg-primary justify-end" : "bg-border justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white block shadow" />
              </button>
            </div>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-sans text-xs font-semibold text-foreground">{t("marketingTitle")}</p>
                <p className="font-sans text-[11px] text-muted mt-0.5">{t("marketingDesc")}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={marketingEnabled}
                onClick={() => setMarketingEnabled((v) => !v)}
                className={`shrink-0 w-9 h-5 rounded-full flex items-center px-0.5 transition-colors ${
                  marketingEnabled ? "bg-primary justify-end" : "bg-border justify-start"
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white block shadow" />
              </button>
            </div>
            <button
              type="button"
              onClick={savePreferences}
              className="mt-1 font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors self-start"
            >
              {t("save")}
            </button>
          </div>
        )}

        {!expanded && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setAllConsent("granted")}
              className="font-sans text-xs font-semibold px-4 py-2 rounded-full bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {t("acceptAll")}
            </button>
            <button
              type="button"
              onClick={() => setAllConsent("denied")}
              className="font-sans text-xs font-semibold px-4 py-2 rounded-full border border-border text-foreground hover:border-primary/40 transition-colors"
            >
              {t("decline")}
            </button>
            <button
              type="button"
              onClick={() => setExpanded(true)}
              className="font-sans text-xs font-semibold text-primary hover:underline px-2 py-2"
            >
              {t("customize")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
