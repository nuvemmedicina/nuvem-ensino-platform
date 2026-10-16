"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredAttribution } from "@/lib/utmCapture";

const campo =
  "w-full px-4 py-3 rounded-xl border border-[#C8C2B8] bg-white text-[#0C1E24] text-[15px] placeholder:text-[#5C747A]/50 focus:outline-none focus:border-[#00475E] focus:ring-2 focus:ring-[#00475E]/10 transition";
const rotulo = "block text-[11px] font-bold tracking-[0.1em] uppercase text-[#5C747A] mb-1.5";

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length >= 7)
    return d.replace(/(\d{2})(\d{1})(\d{4})(\d{0,4})/, (_, a, b, c, e) => `(${a}) ${b} ${c}${e ? "-" + e : ""}`);
  if (d.length >= 3) return d.replace(/(\d{2})(\d+)/, "($1) $2");
  return d;
}

export default function AulaGratuitaForm() {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [especialidade, setEspecialidade] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [aceita, setAceita] = useState(true);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!nome.trim() || !especialidade.trim() || !telefone.trim() || !email.trim()) {
      setError("Preencha todos os campos para liberar a aula.");
      return;
    }
    const origem =
      new URLSearchParams(window.location.search).get("utm_source") ?? getStoredAttribution()?.utmSource ?? "";
    startTransition(async () => {
      try {
        const res = await fetch("/api/aula-gratuita", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, especialidade, telefone, email, aceitaComunicacoes: aceita, origem }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          setError(data?.error ?? "Não foi possível liberar a aula. Tente novamente.");
          return;
        }
        // A resposta grava o cookie de acesso; recarregar a página mostra o vídeo.
        router.refresh();
      } catch {
        setError("Não foi possível liberar a aula. Tente novamente.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <label htmlFor="ag-nome" className={rotulo}>Nome completo</label>
        <input id="ag-nome" type="text" value={nome} onChange={(e) => setNome(e.target.value)}
          placeholder="Seu nome" autoComplete="name" className={campo} />
      </div>

      <div>
        <label htmlFor="ag-esp" className={rotulo}>Especialidade</label>
        <input id="ag-esp" type="text" value={especialidade} onChange={(e) => setEspecialidade(e.target.value)}
          placeholder="Ex: Gastroenterologista, Clínico Geral, Residente…" className={campo} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ag-tel" className={rotulo}>WhatsApp</label>
          <input id="ag-tel" type="tel" value={telefone} onChange={(e) => setTelefone(maskPhone(e.target.value))}
            placeholder="(31) 9 9999-9999" autoComplete="tel" className={campo} />
        </div>
        <div>
          <label htmlFor="ag-email" className={rotulo}>E-mail</label>
          <input id="ag-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com" autoComplete="email" className={campo} />
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-[13px] text-[#5C747A] leading-relaxed cursor-pointer">
        <input type="checkbox" checked={aceita} onChange={(e) => setAceita(e.target.checked)}
          className="mt-1 h-4 w-4 accent-[#00475E] shrink-0" />
        <span>Aceito receber da NU.V.E.M ENSINO conteúdos e novidades sobre cursos por e-mail e WhatsApp. Posso cancelar quando quiser.</span>
      </label>

      {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full mt-2 py-4 rounded-xl bg-[#00475E] hover:bg-[#003344] text-white font-bold text-[15px] tracking-[0.01em] disabled:opacity-60 transition-all hover:shadow-[0_4px_20px_rgba(0,71,94,0.35)] focus-visible:outline-2 focus-visible:outline-[#B8973A] focus-visible:outline-offset-3"
      >
        {isPending ? "Liberando…" : "Quero assistir à aula →"}
      </button>

      <p className="text-[11px] text-center text-[#5C747A] leading-relaxed">
        A aula abre na hora, nesta página. Também enviamos o link para o seu e-mail.{" "}
        <Link href="/privacidade" className="underline">Política de privacidade</Link>.
      </p>
    </form>
  );
}
