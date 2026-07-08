"use client";

import { useState, useTransition } from "react";

export default function LiveRegistrationForm() {
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function maskPhone(value: string) {
    const d = value.replace(/\D/g, "").slice(0, 11);
    if (d.length >= 7)
      return d.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, (_, a, b, c, e) => `(${a}) ${b} ${c}${e ? "-" + e : ""}`);
    if (d.length >= 3) return d.replace(/(\d{2})(\d+)/, "($1) $2");
    return d;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nome.trim() || !especialidade.trim() || !telefone.trim() || !email.trim()) {
      setError("Preencha todos os campos para confirmar sua inscrição.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/live-registro", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, especialidade, telefone, email }),
        });
        if (!res.ok) throw new Error();
        setDone(true);
      } catch {
        setError("Erro ao salvar inscrição. Tente novamente.");
      }
    });
  }

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-3xl">
          ✅
        </div>
        <h3
          className="text-[#00475E] dark:text-[#1A8CAA] text-xl font-normal"
          style={{ fontFamily: "Georgia, serif" }}
        >
          Inscrição confirmada!
        </h3>
        <p className="text-sm text-[#5C747A] dark:text-[#8AADB5] leading-relaxed max-w-[34ch]">
          Você receberá o link da live no seu e-mail e WhatsApp antes do evento.
          Fique atento!
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#5C747A] dark:text-[#8AADB5] mb-1.5">
          Nome completo
        </label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome"
          autoComplete="name"
          className="w-full px-4 py-3 rounded-xl border border-[#C8C2B8] dark:border-[#2A4555] bg-white dark:bg-[#0E2530] text-[#0C1E24] dark:text-[#EAE6E0] text-[15px] placeholder:text-[#5C747A]/50 focus:outline-none focus:border-[#00475E] focus:ring-2 focus:ring-[#00475E]/10 transition"
        />
      </div>

      <div>
        <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#5C747A] dark:text-[#8AADB5] mb-1.5">
          Especialidade
        </label>
        <input
          type="text"
          value={especialidade}
          onChange={(e) => setEspecialidade(e.target.value)}
          placeholder="Ex: Gastroenterologista, Clínico Geral, Residente…"
          className="w-full px-4 py-3 rounded-xl border border-[#C8C2B8] dark:border-[#2A4555] bg-white dark:bg-[#0E2530] text-[#0C1E24] dark:text-[#EAE6E0] text-[15px] placeholder:text-[#5C747A]/50 focus:outline-none focus:border-[#00475E] focus:ring-2 focus:ring-[#00475E]/10 transition"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#5C747A] dark:text-[#8AADB5] mb-1.5">
            WhatsApp
          </label>
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(maskPhone(e.target.value))}
            placeholder="(31) 9 9999-9999"
            autoComplete="tel"
            className="w-full px-4 py-3 rounded-xl border border-[#C8C2B8] dark:border-[#2A4555] bg-white dark:bg-[#0E2530] text-[#0C1E24] dark:text-[#EAE6E0] text-[15px] placeholder:text-[#5C747A]/50 focus:outline-none focus:border-[#00475E] focus:ring-2 focus:ring-[#00475E]/10 transition"
          />
        </div>
        <div>
          <label className="block text-[11px] font-bold tracking-[0.1em] uppercase text-[#5C747A] dark:text-[#8AADB5] mb-1.5">
            E-mail
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl border border-[#C8C2B8] dark:border-[#2A4555] bg-white dark:bg-[#0E2530] text-[#0C1E24] dark:text-[#EAE6E0] text-[15px] placeholder:text-[#5C747A]/50 focus:outline-none focus:border-[#00475E] focus:ring-2 focus:ring-[#00475E]/10 transition"
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-4 rounded-xl bg-[#00475E] hover:bg-[#003344] text-white font-bold text-[15px] tracking-[0.01em] disabled:opacity-60 transition-all hover:shadow-[0_4px_20px_rgba(0,71,94,0.35)] focus-visible:outline-2 focus-visible:outline-[#B8973A] focus-visible:outline-offset-3"
      >
        {isPending ? "Confirmando…" : "Quero participar da live →"}
      </button>

      <p className="text-[11px] text-center text-[#5C747A] dark:text-[#8AADB5] leading-relaxed">
        Seus dados estão seguros. Enviamos apenas o link da live no dia do evento.
      </p>
    </form>
  );
}
