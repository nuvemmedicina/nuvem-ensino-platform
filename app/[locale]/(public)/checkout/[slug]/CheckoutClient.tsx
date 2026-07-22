"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, QrCode, FileText, Loader2, Shield, CheckCircle, Zap, Copy, Check, X, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

type PaymentMethod = "pix" | "boleto" | "parcelado";

type Props = {
  slug: string;
  courseName: string;
  price: number;
  hours: number;
  userEmail: string;
  userName: string;
  userPhone: string;
  hasPayment: boolean;
  promoNotice?: string;
  isGuest?: boolean;
};

export default function CheckoutClient({
  slug,
  courseName,
  price,
  hours,
  userEmail,
  userName,
  userPhone,
  hasPayment,
  promoNotice,
  isGuest = false,
}: Props) {
  const t = useTranslations("checkout");
  const router = useRouter();
  const [method, setMethod] = useState<PaymentMethod>("pix");
  const [couponCode, setCouponCode] = useState("");
  const [whatsapp, setWhatsapp] = useState(userPhone);
  const [cpf, setCpf] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponDiscountPct, setCouponDiscountPct] = useState(0);
  const [couponError, setCouponError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [isCouponLoading, setIsCouponLoading] = useState(false);
  const [isFreeEnrolling, setIsFreeEnrolling] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [pixData, setPixData] = useState<{ image: string; copyPaste: string } | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [cpfError, setCpfError] = useState("");
  const [pixSecondsLeft, setPixSecondsLeft] = useState(0);
  const pixTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [installments, setInstallments] = useState(3);
  const [guestName, setGuestName] = useState(userName);
  const [guestEmail, setGuestEmail] = useState(userEmail);
  const [guestNameError, setGuestNameError] = useState("");
  const [guestEmailError, setGuestEmailError] = useState("");

  // Temporizador do PIX (30 minutos = 1800 segundos)
  useEffect(() => {
    if (pixData) {
      setPixSecondsLeft(30 * 60);
      pixTimerRef.current = setInterval(() => {
        setPixSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(pixTimerRef.current!);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      if (pixTimerRef.current) clearInterval(pixTimerRef.current);
    }
    return () => { if (pixTimerRef.current) clearInterval(pixTimerRef.current); };
  }, [pixData]);

  const pixMinutes = Math.floor(pixSecondsLeft / 60).toString().padStart(2, "0");
  const pixSeconds = (pixSecondsLeft % 60).toString().padStart(2, "0");
  const pixExpired = pixSecondsLeft === 0 && pixData !== null;

  const methodLabels: Record<PaymentMethod, { label: string; desc: string; icon: React.ReactNode }> = {
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

  const discount = couponApplied ? Math.round(price * (couponDiscountPct / 100) * 100) / 100 : 0;
  const finalPrice = price - discount;

  const formatted = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  function validateCpf(value: string): boolean {
    const digits = value.replace(/\D/g, "");
    if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    if (r !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    r = (sum * 10) % 11;
    if (r === 10 || r === 11) r = 0;
    return r === parseInt(digits[10]);
  }

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
        setCouponDiscountPct(data.discountPct ?? 0);
      } else {
        setCouponError(t("couponInvalid"));
      }
    } catch {
      setCouponError(t("couponError"));
    } finally {
      setIsCouponLoading(false);
    }
  }

  function validateGuestFields(): boolean {
    if (!isGuest) return true;
    let ok = true;
    if (guestName.trim().length < 2) { setGuestNameError("Informe seu nome completo."); ok = false; }
    else setGuestNameError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) { setGuestEmailError("E-mail inválido."); ok = false; }
    else setGuestEmailError("");
    return ok;
  }

  async function handlePayment() {
    setPaymentError("");
    setCpfError("");

    if (!validateGuestFields()) return;

    // Cupom 100% — não exige CPF nem método de pagamento
    if (finalPrice === 0) {
      startTransition(async () => {
        try {
          const res = await fetch("/api/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              courseSlug: slug,
              method: "free",
              couponCode: couponApplied ? couponCode : undefined,
              name: isGuest ? guestName.trim() : undefined,
              email: isGuest ? guestEmail.trim() : undefined,
            }),
          });
          const data = await res.json();
          if (data.url) window.location.href = data.url;
          else if (data.error) setPaymentError(data.error);
        } catch { setPaymentError("Erro ao processar. Tente novamente."); }
      });
      return;
    }

    const cpfDigits = cpf.replace(/\D/g, "");
    if (!cpfDigits) { setCpfError("CPF é obrigatório."); return; }
    if (!validateCpf(cpfDigits)) { setCpfError("CPF inválido. Verifique os números e tente novamente."); return; }
    startTransition(async () => {
      try {
        const res = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courseSlug: slug,
            method,
            couponCode: couponApplied ? couponCode : undefined,
            installments: method === "parcelado" ? installments : 1,
            whatsapp: whatsapp.trim() || undefined,
            cpf: cpf.replace(/\D/g, "") || undefined,
            name: isGuest ? guestName.trim() : undefined,
            email: isGuest ? guestEmail.trim() : undefined,
          }),
        });
        const data = await res.json();

        if (data.url) {
          window.location.href = data.url;
        } else if (data.pixQrCodeImage) {
          setPixData({ image: data.pixQrCodeImage, copyPaste: data.pixCopyPaste });
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

  async function copyPix() {
    if (!pixData) return;
    await navigator.clipboard.writeText(pixData.copyPaste);
    setPixCopied(true);
    setTimeout(() => setPixCopied(false), 3000);
  }

  const submitLabel =
    method === "pix"
      ? t("generatePix")
      : method === "boleto"
      ? t("generateBoleto")
      : t("finishPayment");

  // ── Curso gratuito: tela simplificada ──────────────────────────────────────
  if (price === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="bg-canvas px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <p className="font-sans text-xs font-semibold uppercase tracking-widest text-accent/70 mb-2">
              {t("badge")}
            </p>
            <h1 className="font-serif text-3xl font-light text-white">{courseName}</h1>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 flex items-start justify-center px-4 py-16">
          <div className="w-full max-w-md space-y-6">
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              {/* Badge gratuito */}
              <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 block" />
                <span className="font-sans text-xs font-semibold text-green-600 uppercase tracking-wider">
                  Acesso gratuito
                </span>
              </div>

              <h2 className="font-serif text-2xl font-medium text-foreground mb-2">
                {courseName}
              </h2>
              <p className="font-sans text-sm text-muted mb-1">
                Olá, <strong>{userName}</strong>! Este curso é gratuito.
              </p>
              <p className="font-sans text-sm text-muted mb-8">
                Clique abaixo para se inscrever e acessar as aulas imediatamente.
              </p>

              <button
                onClick={handleFreeEnroll}
                disabled={isFreeEnrolling}
                className="w-full flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-4 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
              >
                {isFreeEnrolling ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                {isFreeEnrolling ? "Inscrevendo…" : "Acessar gratuitamente →"}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 font-sans text-xs text-muted/60">
                <Shield className="w-3 h-3" />
                Sua vaga é confirmada na hora
              </div>
            </div>

            {/* Info do aluno */}
            <div className="bg-surface border border-border rounded-2xl p-5">
              <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-3">
                Seus dados
              </p>
              <div className="space-y-2 font-sans text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Nome</span>
                  <span className="text-foreground">{userName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">E-mail</span>
                  <span className="text-foreground truncate max-w-[200px]">{userEmail}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">

      {/* PIX Modal */}
      {pixData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-sans text-base font-semibold text-foreground">Pagar com PIX</h2>
                <p className="font-sans text-xs text-muted mt-0.5">Escaneie o QR code ou copie o código</p>
              </div>
              <button
                onClick={() => setPixData(null)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Temporizador */}
            <div className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 mb-4 ${pixExpired ? "bg-red-50 border border-red-200" : "bg-amber-50 border border-amber-200"}`}>
              <Clock className={`w-4 h-4 shrink-0 ${pixExpired ? "text-red-500" : "text-amber-600"}`} />
              {pixExpired ? (
                <p className="font-sans text-sm font-semibold text-red-600">QR Code expirado — gere um novo</p>
              ) : (
                <p className="font-sans text-sm text-amber-700">
                  Expira em <strong className="tabular-nums">{pixMinutes}:{pixSeconds}</strong>
                </p>
              )}
            </div>

            {/* QR Code */}
            {!pixExpired && (
              <div className="flex justify-center mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/png;base64,${pixData.image}`}
                  alt="QR Code PIX"
                  className="w-48 h-48 rounded-xl border border-border"
                />
              </div>
            )}

            {/* Copy & paste */}
            {!pixExpired && (
              <div className="space-y-2">
                <p className="font-sans text-xs text-muted text-center">ou copie o código PIX Copia e Cola</p>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={pixData.copyPaste}
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-muted truncate"
                  />
                  <button
                    onClick={copyPix}
                    className="flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shrink-0"
                  >
                    {pixCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {pixCopied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            {pixExpired ? (
              <button
                onClick={() => setPixData(null)}
                className="w-full mt-4 font-sans text-sm font-semibold py-3 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                Gerar novo PIX
              </button>
            ) : (
              <p className="font-sans text-[11px] text-muted/70 text-center mt-4">
                Após o pagamento, seu acesso é liberado automaticamente.
              </p>
            )}
          </div>
        </div>
      )}

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
                {isGuest ? (
                  <>
                    <input
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      placeholder="Seu nome completo"
                      className={`px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted/40 focus:outline-none ${guestNameError ? "border-red-400" : "border-border focus:border-primary/50"}`}
                    />
                    {guestNameError && <p className="font-sans text-xs text-red-500 mt-0.5">{guestNameError}</p>}
                  </>
                ) : (
                  <input
                    readOnly
                    value={userName}
                    className="px-3 py-2.5 rounded-lg border border-border bg-background/50 text-sm text-foreground/70"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="font-sans text-xs text-muted">{t("email")}</label>
                {isGuest ? (
                  <>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      placeholder="voce@email.com"
                      className={`px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted/40 focus:outline-none ${guestEmailError ? "border-red-400" : "border-border focus:border-primary/50"}`}
                    />
                    {guestEmailError && <p className="font-sans text-xs text-red-500 mt-0.5">{guestEmailError}</p>}
                  </>
                ) : (
                  <input
                    readOnly
                    value={userEmail}
                    className="px-3 py-2.5 rounded-lg border border-border bg-background/50 text-sm text-foreground/70"
                  />
                )}
              </div>
            </div>
            {isGuest && (
              <p className="font-sans text-[11px] text-muted mt-3">
                Você vai receber um e-mail para criar sua senha de acesso assim que a matrícula for confirmada.
              </p>
            )}
            {/* CPF */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="font-sans text-xs text-muted flex items-center gap-1">
                CPF <span className="text-red-500">*</span>
                <span className="text-muted/50">(obrigatório para emissão do boleto/Pix)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cpf}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, 11);
                  setCpf(digits.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, (_, a, b, c, d) => d ? `${a}.${b}.${c}-${d}` : c ? `${a}.${b}.${c}` : b ? `${a}.${b}` : a));
                }}
                placeholder="000.000.000-00"
                className={`w-full px-3 py-2.5 rounded-lg border bg-background text-sm text-foreground placeholder:text-muted/40 focus:outline-none font-mono ${cpfError ? "border-red-400 focus:border-red-400" : "border-border focus:border-primary/50"}`}
              />
              {cpfError && <p className="font-sans text-xs text-red-500 mt-1">{cpfError}</p>}
            </div>

            {/* WhatsApp */}
            <div className="flex flex-col gap-1.5 mt-1">
              <label className="font-sans text-xs text-muted flex items-center gap-1">
                WhatsApp
                <span className="text-muted/50">(para inclusão no grupo do curso)</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-muted select-none">🇧🇷</span>
                <input
                  type="tel"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="(31) 9 9999-9999"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
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
                <p className="font-semibold text-foreground mb-3">{t("installments")}</p>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setInstallments(n)}
                    className={`w-full flex justify-between items-center py-2 px-3 rounded-lg border transition-colors mb-1.5 last:mb-0 ${
                      installments === n
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:bg-border/30 text-muted"
                    }`}
                  >
                    <span className="font-semibold">{n}x</span>
                    <span className={`font-medium ${installments === n ? "text-primary" : "text-foreground"}`}>
                      {formatted(Math.ceil((finalPrice / n) * 100) / 100)}
                    </span>
                  </button>
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
                Cupom aplicado, {couponDiscountPct}% de desconto
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

            {promoNotice && (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-400/30 rounded-full px-3 py-1.5 mb-4 w-fit">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <p className="font-sans text-[11px] font-semibold text-red-600 uppercase tracking-wide">
                  {promoNotice}
                </p>
              </div>
            )}

            <div className="flex flex-col gap-3 text-sm font-sans mb-5">
              <span className="text-foreground font-medium leading-snug">{courseName}</span>
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
