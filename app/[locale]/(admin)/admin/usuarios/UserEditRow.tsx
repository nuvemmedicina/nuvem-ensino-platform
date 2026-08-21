"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Check, AlertCircle, KeyRound, Copy, Loader2 } from "lucide-react";
import { updateUser, resendAccessLink } from "./actions";
import { RoleSelector } from "./RoleSelector";
import { CheckCircle, XCircle } from "lucide-react";

type Role = "STUDENT" | "INSTRUCTOR" | "EDITOR" | "ADMIN";

type User = {
  id: string;
  name: string | null;
  email: string;
  role: Role;
  emailVerified: boolean;   // passed as boolean from server to avoid Date serialization
  hasAccess: boolean;       // tem senha definida ou login social
  _count: { enrollments: number };
};

const inputClass =
  "w-full px-2.5 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";

export function UserEditRow({
  user: u,
  isSelf,
  dateFormatted,
}: {
  user: User;
  isSelf: boolean;
  dateFormatted: string;
}) {
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [access, setAccess] = useState<{ link: string; emailSent: boolean; emailError: string | null } | null>(null);
  const [accessError, setAccessError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSending, startSending] = useTransition();

  function handleResend() {
    setAccessError(null);
    setCopied(false);
    startSending(async () => {
      try {
        setAccess(await resendAccessLink(u.id));
      } catch (err) {
        setAccessError((err as Error).message);
      }
    });
  }

  async function copyLink() {
    if (!access) return;
    await navigator.clipboard.writeText(access.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      try {
        const r = await updateUser(u.id, formData);
        if (r.ok) setEditing(false);
        else setError(r.erro);
      } catch (err) {
        // Só cai aqui em falha real (rede, exceção inesperada) — os erros de
        // validação vêm no retorno, com a mensagem preservada.
        setError((err as Error).message);
      }
    });
  }

  if (editing) {
    return (
      <tr className="bg-primary/5 border-b border-border">
        <td colSpan={5} className="px-5 py-4">
          <form action={handleSubmit}>
            <div className="flex flex-col sm:flex-row gap-3 items-start">
              <div className="flex-1 min-w-0">
                <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                  Nome
                </label>
                <input
                  name="name"
                  defaultValue={u.name ?? ""}
                  placeholder="Nome completo"
                  className={inputClass}
                />
              </div>
              <div className="flex-1 min-w-0">
                <label className="block font-sans text-[10px] font-semibold text-muted uppercase tracking-wider mb-1">
                  E-mail
                </label>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue={u.email}
                  placeholder="email@exemplo.com"
                  className={inputClass}
                />
              </div>
              <div className="flex items-end gap-2 pt-5 shrink-0">
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark disabled:opacity-50 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  {isPending ? "Salvando…" : "Salvar"}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditing(false); setError(null); }}
                  className="flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:text-foreground transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Cancelar
                </button>
              </div>
            </div>
            {error && (
              <div className="flex items-center gap-2 mt-2 text-red-500">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-sans text-xs">{error}</span>
              </div>
            )}
          </form>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-background/50 transition-colors group">
      {/* Nome + email */}
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          <div className="min-w-0">
            <p className="font-sans text-sm font-medium text-foreground leading-tight">
              {u.name ?? "—"}
            </p>
            <p className="font-sans text-xs text-muted">{u.email}</p>

            {!u.hasAccess && (
              <span className="inline-block mt-1 font-sans text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                sem senha definida
              </span>
            )}

            {/* Resultado do reenvio: o link aparece mesmo se o e-mail falhar */}
            {access && (
              <div className="mt-2 max-w-md rounded-lg border border-border bg-background px-3 py-2">
                <p className={`font-sans text-[11px] font-semibold ${access.emailSent ? "text-green-700" : "text-amber-700"}`}>
                  {access.emailSent
                    ? "E-mail enviado. Link válido por 7 dias:"
                    : `E-mail não saiu (${access.emailError}). Envie o link por WhatsApp:`}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <code className="flex-1 min-w-0 truncate font-mono text-[10px] text-foreground/80">
                    {access.link}
                  </code>
                  <button
                    onClick={copyLink}
                    className="shrink-0 flex items-center gap-1 font-sans text-[10px] font-semibold px-2 py-1 rounded-md bg-primary text-white hover:bg-primary-dark transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>
            )}

            {accessError && (
              <p className="mt-1.5 font-sans text-[11px] text-red-600">{accessError}</p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              onClick={() => setEditing(true)}
              className="p-1 rounded-lg text-muted opacity-0 group-hover:opacity-100 hover:text-primary hover:bg-primary/10 transition-all"
              title="Editar nome / e-mail"
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={handleResend}
              disabled={isSending}
              className={`p-1 rounded-lg transition-all hover:text-primary hover:bg-primary/10 disabled:opacity-50 ${
                u.hasAccess ? "text-muted opacity-0 group-hover:opacity-100" : "text-amber-600"
              }`}
              title="Gerar e enviar link de acesso"
            >
              {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <KeyRound className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </td>

      {/* Role */}
      <td className="px-5 py-3.5">
        <RoleSelector userId={u.id} currentRole={u.role} isSelf={isSelf} />
      </td>

      {/* Email verificado */}
      <td className="px-5 py-3.5 hidden sm:table-cell">
        {u.emailVerified ? (
          <CheckCircle className="w-4 h-4 text-green-500" />
        ) : (
          <XCircle className="w-4 h-4 text-red-400/70" />
        )}
      </td>

      {/* Matrículas */}
      <td className="px-5 py-3.5 hidden md:table-cell">
        <span className="font-sans text-sm text-foreground">{u._count.enrollments}</span>
      </td>

      {/* Data de cadastro */}
      <td className="px-5 py-3.5 hidden lg:table-cell">
        <span className="font-sans text-xs text-muted">{dateFormatted}</span>
      </td>
    </tr>
  );
}
