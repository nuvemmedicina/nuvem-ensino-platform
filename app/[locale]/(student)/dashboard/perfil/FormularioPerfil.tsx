"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, KeyRound } from "lucide-react";
import { salvarPerfil, type EstadoPerfil } from "./actions";

type Dados = { nome: string; telefone: string; especialidade: string; crm: string; email: string; cpf: string | null };

const campo =
  "w-full min-h-[44px] px-3.5 rounded-xl border border-border bg-surface font-sans text-[15px] text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
const rotulo = "block font-sans text-sm font-semibold text-foreground mb-1.5";

export function FormularioPerfil({ dados }: { dados: Dados }) {
  const t = useTranslations("novaArea.paginas.perfil");
  const [estado, acao, pendente] = useActionState<EstadoPerfil, FormData>(salvarPerfil, null);

  return (
    <form action={acao} className="flex flex-col gap-5">
      <div>
        <label htmlFor="perfil-nome" className={rotulo}>{t("nome")}</label>
        <input id="perfil-nome" name="nome" defaultValue={dados.nome} required autoComplete="name" className={campo} aria-describedby="perfil-nome-ajuda" />
        <p id="perfil-nome-ajuda" className="font-sans text-xs text-muted mt-1.5">{t("nomeAjuda")}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="perfil-telefone" className={rotulo}>{t("telefone")}</label>
          <input id="perfil-telefone" name="telefone" type="tel" defaultValue={dados.telefone} autoComplete="tel" className={campo} />
        </div>
        <div>
          <label htmlFor="perfil-especialidade" className={rotulo}>{t("especialidade")}</label>
          <input id="perfil-especialidade" name="especialidade" defaultValue={dados.especialidade} placeholder={t("especialidadePh")} className={campo} />
        </div>
        <div>
          <label htmlFor="perfil-crm" className={rotulo}>{t("crm")}</label>
          <input id="perfil-crm" name="crm" defaultValue={dados.crm} placeholder={t("crmPh")} className={campo} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="perfil-email" className={rotulo}>{t("email")}</label>
          <input id="perfil-email" value={dados.email} readOnly className={`${campo} bg-background text-muted cursor-default`} />
        </div>
        {dados.cpf && (
          <div>
            <label htmlFor="perfil-cpf" className={rotulo}>{t("cpf")}</label>
            <input id="perfil-cpf" value={dados.cpf} readOnly className={`${campo} bg-background text-muted cursor-default`} />
          </div>
        )}
      </div>
      <p className="font-sans text-xs text-muted -mt-2">{t("naoEditavel")}</p>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pendente}
          className="min-h-[48px] px-6 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
        >
          {pendente ? t("salvando") : t("salvar")}
        </button>
        <p className="font-sans text-sm" aria-live="polite">
          {estado?.ok && (
            <span className="inline-flex items-center gap-1.5 text-green-800">
              <Check className="w-4 h-4" aria-hidden="true" />
              {t("salvo")}
            </span>
          )}
          {estado && !estado.ok && <span className="text-red-700">{estado.erro === "nome" ? t("erroNome") : t("erro")}</span>}
        </p>
      </div>
    </form>
  );
}

/** Manda para o e-mail da pessoa o mesmo link do "Esqueci minha senha". */
export function BotaoSenha({ email }: { email: string }) {
  const t = useTranslations("novaArea.paginas.perfil");
  const [estado, setEstado] = useState<"" | "enviando" | "enviado" | "erro">("");

  async function enviar() {
    setEstado("enviando");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setEstado(res.ok ? "enviado" : "erro");
    } catch {
      setEstado("erro");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={enviar}
        disabled={estado === "enviando" || estado === "enviado"}
        className="self-start inline-flex items-center gap-2 min-h-[44px] px-5 rounded-full border border-primary/30 text-primary font-sans text-sm font-semibold hover:bg-primary/5 disabled:opacity-60"
      >
        <KeyRound className="w-4 h-4" aria-hidden="true" />
        {t("senha")}
      </button>
      <p className="font-sans text-sm text-muted" aria-live="polite">
        {estado === "enviado" ? (
          <span className="text-green-800">{t("senhaAjuda")}</span>
        ) : estado === "erro" ? (
          <span className="text-red-700">{t("erro")}</span>
        ) : (
          t("senhaAjuda")
        )}
      </p>
    </div>
  );
}
