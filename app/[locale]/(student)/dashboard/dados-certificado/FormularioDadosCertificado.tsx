"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { UFS, type DadosCertificado } from "@/lib/dadosCertificado";
import { salvarDadosCertificado, type EstadoDadosCertificado } from "./actions";

const campo =
  "w-full min-h-[44px] px-3.5 rounded-xl border bg-surface font-sans text-[15px] text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50";
const rotulo = "block font-sans text-sm font-semibold text-foreground mb-1.5";

function mascaraCpf(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
function mascaraCep(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}
function mascaraTelefone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function FormularioDadosCertificado({ inicial, cpfFixo }: { inicial: DadosCertificado; cpfFixo: boolean }) {
  const t = useTranslations("novaArea.paginas.dadosCertificado");
  const [estado, acao, pendente] = useActionState<EstadoDadosCertificado, FormData>(salvarDadosCertificado, null);
  // Tudo controlado: o React limpa campos não controlados depois de uma
  // action, e o aluno perderia o que digitou quando faltasse um campo.
  const [d, setD] = useState<DadosCertificado>({
    ...inicial,
    cpf: mascaraCpf(inicial.cpf),
    cep: mascaraCep(inicial.cep),
    telefone: mascaraTelefone(inicial.telefone),
  });
  const [confirmo, setConfirmo] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);
  const set = (k: keyof DadosCertificado, v: string) => setD((x) => ({ ...x, [k]: v }));

  const erros = new Set(estado && !estado.ok && "erros" in estado ? estado.erros : []);
  const erro = (k: string) => erros.has(k as never);
  const borda = (k: string) => (erro(k) ? "border-red-500" : "border-border");
  const msg = (k: string) =>
    erro(k) ? (
      <p id={`dc-${k}-erro`} className="font-sans text-xs text-red-700 mt-1.5">
        {t(`erroCampo.${k}`)}
      </p>
    ) : null;
  const aria = (k: string) => (erro(k) ? { "aria-invalid": true, "aria-describedby": `dc-${k}-erro` } : {});

  // Preenche rua, bairro, cidade e UF pelo CEP (ViaCEP), como no checkout.
  async function buscarCep(cep: string) {
    const digitos = cep.replace(/\D/g, "");
    if (digitos.length !== 8) return;
    setBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digitos}/json/`);
      const r = await res.json();
      if (!r.erro) {
        setD((x) => ({
          ...x,
          rua: r.logradouro || x.rua,
          bairro: r.bairro || x.bairro,
          cidade: r.localidade || x.cidade,
          uf: r.uf || x.uf,
        }));
      }
    } catch {
      // Sem ViaCEP, o aluno digita.
    } finally {
      setBuscandoCep(false);
    }
  }

  const texto = (k: keyof DadosCertificado, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      id={`dc-${k}`}
      name={k}
      value={d[k]}
      onChange={(e) => set(k, e.target.value)}
      className={`${campo} ${borda(k)}`}
      {...aria(k)}
      {...props}
    />
  );
  const seletorUf = (k: "uf" | "naturalidadeUf", rotuloAcessivel: string) => (
    <select
      id={`dc-${k}`}
      name={k}
      value={d[k]}
      onChange={(e) => set(k, e.target.value)}
      aria-label={rotuloAcessivel}
      className={`${campo} ${borda(k)}`}
      {...aria(k)}
    >
      <option value="">{t("ufEscolha")}</option>
      {UFS.map((uf) => (
        <option key={uf} value={uf}>
          {uf}
        </option>
      ))}
    </select>
  );

  return (
    <form action={acao} className="flex flex-col gap-8" noValidate>
      <fieldset className="flex flex-col gap-5">
        <legend className="font-sans text-lg font-semibold text-foreground mb-4">{t("identificacao")}</legend>

        <div>
          <label htmlFor="dc-nome" className={rotulo}>{t("nome")}</label>
          {texto("nome", { autoComplete: "name", required: true })}
          {msg("nome") ?? <p className="font-sans text-xs text-muted mt-1.5">{t("nomeAjuda")}</p>}
        </div>

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <label htmlFor="dc-cpf" className={rotulo}>{t("cpf")}</label>
            {cpfFixo ? (
              <>
                <input id="dc-cpf" value={d.cpf} readOnly className={`${campo} border-border bg-background text-muted cursor-default`} aria-describedby="dc-cpf-fixo" />
                <p id="dc-cpf-fixo" className="font-sans text-xs text-muted mt-1.5">{t("cpfFixo")}</p>
              </>
            ) : (
              <>
                <input
                  id="dc-cpf"
                  name="cpf"
                  inputMode="numeric"
                  value={d.cpf}
                  onChange={(e) => set("cpf", mascaraCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className={`${campo} ${borda("cpf")} font-mono`}
                  {...aria("cpf")}
                />
                {msg("cpf")}
              </>
            )}
          </div>
          <div>
            <label htmlFor="dc-rg" className={rotulo}>{t("rg")}</label>
            {texto("rg")}
            {msg("rg")}
          </div>
          <div>
            <label htmlFor="dc-rgOrgao" className={rotulo}>{t("rgOrgao")}</label>
            {texto("rgOrgao", { placeholder: t("rgOrgaoPh") })}
            {msg("rgOrgao")}
          </div>
        </div>

        <div className="grid gap-5 grid-cols-[1fr_7rem]">
          <div>
            <label htmlFor="dc-naturalidadeCidade" className={rotulo}>{t("naturalidade")}</label>
            {texto("naturalidadeCidade")}
            {msg("naturalidadeCidade")}
          </div>
          <div>
            <label htmlFor="dc-naturalidadeUf" className={rotulo}>{t("uf")}</label>
            {seletorUf("naturalidadeUf", `${t("naturalidade")}: ${t("uf")}`)}
            {msg("naturalidadeUf")}
          </div>
        </div>
      </fieldset>

      {/* Divisória fora do fieldset: a borda do fieldset passa ao lado da legenda */}
      <div className="h-px bg-border" aria-hidden="true" />

      <fieldset className="flex flex-col gap-5">
        <legend className="font-sans text-lg font-semibold text-foreground mb-4">{t("contato")}</legend>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="dc-telefone" className={rotulo}>{t("telefone")}</label>
            <input
              id="dc-telefone"
              name="telefone"
              type="tel"
              autoComplete="tel-national"
              value={d.telefone}
              onChange={(e) => set("telefone", mascaraTelefone(e.target.value))}
              className={`${campo} ${borda("telefone")}`}
              {...aria("telefone")}
            />
            {msg("telefone")}
          </div>
          <div>
            <label htmlFor="dc-cep" className={rotulo}>{t("cep")}</label>
            <div className="relative">
              <input
                id="dc-cep"
                name="cep"
                inputMode="numeric"
                autoComplete="postal-code"
                value={d.cep}
                onChange={(e) => {
                  const cep = mascaraCep(e.target.value);
                  set("cep", cep);
                  if (cep.replace(/\D/g, "").length === 8) void buscarCep(cep);
                }}
                placeholder="00000-000"
                className={`${campo} ${borda("cep")} font-mono`}
                {...aria("cep")}
              />
              {buscandoCep && <Loader2 className="w-4 h-4 animate-spin text-muted absolute right-3 top-1/2 -translate-y-1/2" aria-hidden="true" />}
            </div>
            <p className="sr-only" aria-live="polite">{buscandoCep ? t("buscandoCep") : ""}</p>
            {msg("cep")}
          </div>
        </div>

        <div className="grid gap-5 grid-cols-[1fr_7rem]">
          <div>
            <label htmlFor="dc-rua" className={rotulo}>{t("rua")}</label>
            {texto("rua", { autoComplete: "address-line1" })}
            {msg("rua")}
          </div>
          <div>
            <label htmlFor="dc-numero" className={rotulo}>{t("numero")}</label>
            {texto("numero")}
            {msg("numero")}
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="dc-complemento" className={rotulo}>{t("complemento")}</label>
            {texto("complemento", { autoComplete: "address-line2" })}
          </div>
          <div>
            <label htmlFor="dc-bairro" className={rotulo}>{t("bairro")}</label>
            {texto("bairro")}
            {msg("bairro")}
          </div>
        </div>

        <div className="grid gap-5 grid-cols-[1fr_7rem]">
          <div>
            <label htmlFor="dc-cidade" className={rotulo}>{t("cidade")}</label>
            {texto("cidade", { autoComplete: "address-level2" })}
            {msg("cidade")}
          </div>
          <div>
            <label htmlFor="dc-uf" className={rotulo}>{t("uf")}</label>
            {seletorUf("uf", `${t("cidade")}: ${t("uf")}`)}
            {msg("uf")}
          </div>
        </div>
      </fieldset>

      <div className="flex flex-col gap-2 pt-6 border-t border-border">
        <label className="flex items-start gap-3 font-sans text-[15px] text-foreground cursor-pointer">
          <input
            type="checkbox"
            name="confirmo"
            checked={confirmo}
            onChange={(e) => setConfirmo(e.target.checked)}
            className="mt-1 w-5 h-5 accent-[#00475E] shrink-0"
            {...aria("confirmo")}
          />
          <span>{t("confirmo")}</span>
        </label>
        {msg("confirmo")}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={pendente}
          className="min-h-[48px] px-7 rounded-full bg-primary text-white font-sans text-sm font-semibold hover:bg-primary/90 disabled:opacity-60"
        >
          {pendente ? t("enviando") : t("enviar")}
        </button>
        <p className="font-sans text-sm" aria-live="polite">
          {estado?.ok && (
            <span className="inline-flex items-center gap-1.5 text-green-800">
              <Check className="w-4 h-4" aria-hidden="true" />
              {t("salvo")}
            </span>
          )}
          {estado && !estado.ok && <span className="text-red-700">{"erros" in estado ? t("erroCampos") : t("erro")}</span>}
        </p>
      </div>
      <p className="font-sans text-xs text-muted -mt-4">{t("privacidade")}</p>
    </form>
  );
}
