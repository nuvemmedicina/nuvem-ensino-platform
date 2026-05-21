"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, QrCode, FileText, Loader2, Shield, CheckCircle, Zap } from "lucide-react";
import { useTranslations } from "next-intl";

type PaymentMethod = "stripe" | "pix" | "boleto" | "parcelado";

type Props = {
  slug: string;
  courseName: string;
  price: number;
  hours: number;
  userEmail: string;
  userName: string;
  hasPayment: boolean;
};

export default function CheckoutClient({
  slug,
  courseName,
  price,
  hours,
  userEmail,
  userName,
  hasPayment,
}: Props) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [isFreeEnrolling, setIsFreeEnrolling] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const methodLabels: Record<PaymentMethod, { label: string; desc: string; icon: React.ReactNode }> = {
    stripe: {
      label: t("methods.stripe.label"),
      desc: t("methods.stripe.desc"),
      icon: <CreditCard className="w-4 h-4" />,
    },
    pix: {
      label: t("methods.pix.label"),
      desc: t("methods.pix.desc"),
      icon: <QrCode className="w-4 h-4" />,
    },
    boleto: {
      label: t("methods.boleto.label"),
      desc: t("methods.boleto.desc"),
      icon: <FileText className="w-4 h-4" />,
    },
    parcelado: {
      label: t("methods.parcelado.label"),
      desc: t("methods.parcelado.desc"),
      icon: <CreditCard className="w-4 h-4" />,
    },
  };

  const discount = couponApplied ? Math.round(price * 0.1) : 0;
  const finalPrice = price - discount;

  const formatted = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  async function applyCoupon() {
    if (!couponCode.trim()) return;
    setIsCouponLoading(true);
    setCouponError("");
    try {
      const res = await fetch(`/api/coupons/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode, courseSlug: slug }),
      });
      const data = await res.json();
      if (data.valid) {
        setCouponApplied(true);
      } else {
        setCouponError(t("couponInvalid"));
      }
    } catch {
      setCouponError(t("couponError"));
    } finally {
      setIsCouponLoading(false);
    }
  }

  async function handlePayment() {
    setPaymentError("");
    startTransition(async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseSlug: slug,
            method,
            couponCode: couponApplied ? couponCode : undefined,
          }),
        });
        const data = await res.json();

        if (data.url) {
          window.location.href = data.url;
        } else if (data.pixCode) {
          // TODO: show PIX QR code modal
          alert("PIX: " + data.pixCode);
        } else if (data.error) {
          setPaymentError(data.error);
        }
      } catch {
        setPaymentError("Erro ao processar pagamento. Tente novamente.");
      }
    });
  }

  async function handleFreeEnroll() {
    setIsFreeEnrolling(true);
    try {
      const res = await fetch("/api/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseSlug: slug }),
      });
      const data = await res.json();
      if (data.redirectUrl) router.push(data.redirectUrl);
    } finally {
      setIsFreeEnrolling(false);
    }
  }

  const submitLabel =
    method === "pix"
      ? t("generatePix")
      : method === "boleto"
      ? t("generateBoleto")
      : t("finishPayment");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-canvas px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <p className="font-sans text-xs font-semibold uppercase tracking-widest text-accent/70 mb-2">
            {t("badge")}
          </p>
          <h1 className="font-serif text-3xl font-light text-white">{courseName}</h1>
        </div>
      </div>

      {!hasPayment && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-4">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-sans text-sm font-semibold text-amber-700">{t("demoAccess")}</p>
                <p className="font-sans text-xs text-amber-600/80 mt-0.5">{t("demoDesc")}</p>
              </div>
            </div>
            <button
              onClick={handleFreeEnroll}
              disabled={isFreeEnrolling}
              className="shrink-0 flex items-center gap-2 font-sans text-sm font-semibold px-5 py-2.5 rounded-full bg-amber-500 text-white hover:bg-amber-400 disabled:opacity-60 transition-colors"
            >
              {isFreeEnrolling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {t("accessNow")}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8 items-start">
        {/* ── Formulário ── */}
        <div className="space-y-6">
          {/* Dados do aluno */}
          <section className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-sans text-sm font-semibold text-foreground mb-4">
              {t("yourData")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs text-muted">{t("name")}</label>
                <input
                  readOnly
                  value={userName}
                  className="px-3 py-2.5 rounded-lg border border-border bg-background/50 text-sm text-foreground/70"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs text-muted">{t("email")}</label>
                <input
                  readOnly
                  value={userEmail}
                  className="px-3 py-2.5 rounded-lg border border-border bg-background/50 text-sm text-foreground/70"
                />
              </div>
            </div>
          </section>

          {/* Forma de pagamento */}
          <section className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-sans text-sm font-semibold text-foreground mb-4">
              {t("paymentMethod")}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {(Object.entries(methodLabels) as [PaymentMethod, typeof methodLabels[PaymentMethod]][]).map(
                ([key, { label, desc, icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setMethod(key)}
                    className={`flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all ${
                      method === key
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/30"
                    }`}
                  >
                    <span className={method === key ? "text-primary" : "text-muted"}>
                      {icon}
                    </span>
                    <div>
                      <p
                        className={`font-sans text-sm font-semibold leading-tight ${
                          method === key ? "text-primary" : "text-foreground"
                        }`}
                      >
                        {label}
                      </p>
                      <p className="font-sans text-[11px] text-muted mt-0.5">{desc}</p>
                    </div>
                  </button>
                )
              )}
            </div>

            {/* Info por método */}
            {method === "parcelado" && (
              <div className="mt-4 bg-background rounded-xl p-4 font-sans text-sm text-muted">
                <p className="font-semibold text-foreground mb-2">{t("installments")}</p>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="flex justify-between py-1 border-b border-border last:border-0">
                    <span>{n}x</span>
                    <span className="font-medium text-foreground">
                      {formatted(Math.ceil((finalPrice / n) * 100) / 100)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Cupom */}
          <section className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-sans text-sm font-semibold text-foreground mb-4">
              {t("couponTitle")}
            </h2>
            {couponApplied ? (
              <div className="flex items-center gap-2 text-green-600 font-sans text-sm">
                <CheckCircle className="w-4 h-4" />
                {t("couponApplied")}
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t("couponPlaceholder")}
                  className="flex-1 px-3 py-2.5 rounded-lg border border-border bg-background text-sm font-mono text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
                />
                <button
                  type="button"
                  onClick={applyCoupon}
                  disabled={isCouponLoading || !couponCode.trim()}
                  className="font-sans text-sm font-semibold px-4 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                >
                  {isCouponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("couponApply")}
                </button>
              </div>
            )}
            {couponError && (
              <p className="font-sans text-xs text-red-500 mt-2">{couponError}</p>
            )}
          </section>
        </div>

        {/* ── Resumo ── */}
        <div className="lg:sticky lg:top-8 space-y-4">
          <div className="bg-surface border border-border rounded-2xl p-6">
            <h2 className="font-sans text-sm font-semibold text-foreground mb-5">
              {t("orderSummary")}
            </h2>

            <div className="flex flex-col gap-3 text-sm font-sans mb-5">
              <div className="flex justify-between">
                <span className="text-muted">{courseName}</span>
                <span className="text-foreground">{formatted(price)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>{t("hoursLabel")}</span>
                <span>{hours}h</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{t("discount")}</span>
                  <span>− {formatted(discount)}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between font-semibold">
                <span className="text-foreground">{t("total")}</span>
                <span className="font-serif text-xl text-primary">{formatted(finalPrice)}</span>
              </div>
            </div>

            <button
              onClick={handlePayment}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-4 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              {submitLabel}
            </button>

            {paymentError && (
              <p className="mt-3 font-sans text-xs text-red-500 text-center">{paymentError}</p>
            )}

            <div className="flex items-center justify-center gap-2 mt-4 font-sans text-xs text-muted/60">
              <Shield className="w-3 h-3" />
              {t("securePayment")}
            </div>
          </div>

          <div className="bg-surface border border-border rounded-2xl p-5">
            <p className="font-sans text-xs font-semibold text-foreground mb-3">
              {t("guarantee")}
            </p>
            <p className="font-sans text-xs text-muted leading-relaxed">
              {t("guaranteeDesc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
