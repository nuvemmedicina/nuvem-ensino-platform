"use client";

import { useState, useTransition } from "react";
import { Loader2, Mail, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

type State = "idle" | "loading" | "sent";

export default function EsqueciSenhaPage() {
  const t = useTranslations("auth.forgotPassword");
  const [state, setState] = useState<State>("idle");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = form.get("email") as string;

    startTransition(async () => {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      // Always shows "sent" regardless of whether email exists (security)
      setState("sent");
    });
  }

  return (
    <div>
      {state === "sent" ? (
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="font-serif text-2xl font-light text-foreground mb-2">{t("title")}</h1>
            <p className="font-sans text-sm text-muted leading-relaxed">{t("successMessage")}</p>
          </div>
          <Link href="/entrar" className="mt-2 font-sans text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            {t("backToLogin")}
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-serif text-3xl font-light text-foreground mb-1">{t("title")}</h1>
          <p className="font-sans text-sm text-muted mb-8">{t("subtitle")}</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="font-sans text-xs font-semibold text-foreground/70">
                {t("emailLabel")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 rounded-xl bg-white border border-border text-foreground placeholder:text-muted/50 text-sm focus:outline-none focus:border-primary/50 focus:ring-2 focus:ring-primary/10 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 disabled:opacity-60 transition-colors mt-1"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {t("submitButton")}
            </button>
          </form>

          <p className="font-sans text-sm text-muted text-center mt-7">
            <Link href="/entrar" className="font-semibold text-primary hover:text-primary/80 transition-colors flex items-center justify-center gap-1.5">
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("backToLogin")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
