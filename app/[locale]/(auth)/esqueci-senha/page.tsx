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
    <div className="w-full max-w-sm">
      <div
        className="rounded-2xl border border-white/10 p-8"
        style={{ background: "rgba(255,255,255,0.06)", backdropFilter: "blur(12px)" }}
      >
        {state === "sent" ? (
          /* ── State: email sent ── */
          <div className="flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-accent/15 flex items-center justify-center">
              <Mail className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h1 className="font-serif text-2xl font-light text-white mb-2">
                {t("title")}
              </h1>
              <p className="font-sans text-sm text-white/50 leading-relaxed">
                {t("successMessage")}
              </p>
            </div>
            <Link
              href="/entrar"
              className="mt-2 font-sans text-sm text-accent/80 hover:text-accent transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {t("backToLogin")}
            </Link>
          </div>
        ) : (
          /* ── State: form ── */
          <>
            <h1 className="font-serif text-3xl font-light text-white mb-1">
              {t("title")}
            </h1>
            <p className="font-sans text-sm text-white/50 mb-8">
              {t("subtitle")}
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="font-sans text-xs font-medium text-white/60">
                  {t("emailLabel")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-accent/50 transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-3 rounded-xl bg-accent text-accent-foreground hover:bg-accent-light disabled:opacity-60 transition-colors mt-1"
              >
                {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t("submitButton")}
              </button>
            </form>

            <p className="font-sans text-xs text-white/40 text-center mt-6">
              <Link href="/entrar" className="text-accent/80 hover:text-accent transition-colors flex items-center justify-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("backToLogin")}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
