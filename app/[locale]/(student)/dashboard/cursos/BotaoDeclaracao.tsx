"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FileText } from "lucide-react";
import { cpfValido } from "@/lib/cpf";
import { salvarCpfParaDeclaracao } from "./declaracaoActions";

const botao =
  "inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-border text-foreground font-sans text-sm hover:border-primary/40";

/** Máscara 000.000.000-00 enquanto a pessoa digita. */
function mascara(valor: string) {
  const d = valor.replace(/\D/g, "").slice(0, 11);
  return d
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

/**
 * Baixa a declaração de matrícula (PDF gerado em /api/enrollments/[id]/declaracao).
 * Sem CPF no cadastro, pede o CPF aqui mesmo antes de gerar.
 */
export function BotaoDeclaracao({ matriculaId, temCpf }: { matriculaId: string; temCpf: boolean }) {
  const t = useTranslations("novaArea.paginas.meusCursos.declaracao");
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [cpf, setCpf] = useState("");
  const [erro, setErro] = useState<"" | "invalido" | "geral">("");
  const [pendente, iniciar] = useTransition();
  const url = `/api/enrollments/${matriculaId}/declaracao`;

  if (temCpf) {
    return (
      <a href={url} download className={botao}>
        <FileText className="w-4 h-4" aria-hidden="true" />
        {t("baixar")}
      </a>
    );
  }

  const enviar = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!cpfValido(cpf)) {
      setErro("invalido");
      return;
    }
    const dados = new FormData(e.currentTarget);
    iniciar(async () => {
      const r = await salvarCpfParaDeclaracao(null, dados);
      if (!r?.ok) {
        setErro(r?.erro ?? "geral");
        return;
      }
      setErro("");
      setAberto(false);
      window.location.assign(url);
      // As outras matrículas da lista passam a baixar direto
      router.refresh();
    });
  };

  return (
    <>
      <button type="button" onClick={() => setAberto((a) => !a)} aria-expanded={aberto} aria-controls={`cpf-${matriculaId}`} className={botao}>
        <FileText className="w-4 h-4" aria-hidden="true" />
        {t("baixar")}
      </button>
      {aberto && (
        <form id={`cpf-${matriculaId}`} onSubmit={enviar} noValidate className="w-full bg-background border border-border rounded-xl p-4 flex flex-col gap-3">
          <p className="font-sans text-sm text-foreground">{t("pedirCpf")}</p>
          <div className="flex flex-wrap items-end gap-2.5">
            <div className="flex flex-col gap-1.5">
              <label htmlFor={`cpf-campo-${matriculaId}`} className="font-sans text-sm font-semibold text-foreground">CPF</label>
              <input
                id={`cpf-campo-${matriculaId}`}
                name="cpf"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                value={cpf}
                onChange={(e) => {
                  setCpf(mascara(e.target.value));
                  setErro("");
                }}
                aria-invalid={!!erro}
                aria-describedby={`cpf-erro-${matriculaId}`}
                className="w-48 min-h-[44px] px-3.5 rounded-xl border border-border bg-surface font-sans text-[15px] text-foreground tabular-nums placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50"
              />
            </div>
            <button
              type="submit"
              disabled={pendente}
              className="min-h-[44px] px-5 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
            >
              {pendente ? t("salvando") : t("salvarEBaixar")}
            </button>
          </div>
          <p id={`cpf-erro-${matriculaId}`} className="font-sans text-sm" aria-live="polite">
            {erro === "invalido" && <span className="text-red-700">{t("cpfInvalido")}</span>}
            {erro === "geral" && <span className="text-red-700">{t("erro")}</span>}
          </p>
          <p className="font-sans text-xs text-muted -mt-2">{t("cpfAjuda")}</p>
        </form>
      )}
    </>
  );
}
