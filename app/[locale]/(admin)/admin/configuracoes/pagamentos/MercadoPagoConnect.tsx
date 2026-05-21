"use client";

import { useState } from "react";
import { Copy, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";

type Props = {
  isConnected: boolean;
  mpUserId: string | null;
  mpOk: boolean;
  mpError: string | null;
};

export function MercadoPagoConnect({ isConnected, mpUserId, mpOk, mpError }: Props) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(mpError ?? "");

  async function generateLink() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/mercadopago/connect");
      const data = await res.json();
      if (data.url) {
        setLink(data.url);
      } else {
        setError(data.error ?? "Erro ao gerar link.");
      }
    } catch {
      setError("Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-sans text-base font-semibold text-foreground">Mercado Pago</h2>
          <p className="font-sans text-xs text-muted mt-0.5">PIX · Boleto · Cartão nacional parcelado</p>
        </div>
        {isConnected ? (
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-green-600 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Conectado
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold text-muted bg-border/50 border border-border px-3 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-muted/50" />
            Não conectado
          </span>
        )}
      </div>

      {/* Success banner */}
      {mpOk && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">
          <p className="font-sans text-sm font-semibold text-green-600">Conta conectada com sucesso!</p>
          {mpUserId && (
            <p className="font-sans text-xs text-green-600/70 mt-0.5">ID da conta MP: {mpUserId}</p>
          )}
        </div>
      )}

      {/* Connected state */}
      {isConnected && !mpOk && (
        <div className="bg-background rounded-xl px-4 py-3 border border-border">
          <p className="font-sans text-xs text-muted">Conta vinculada{mpUserId ? ` · ID ${mpUserId}` : ""}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
          <p className="font-sans text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Generate link section */}
      <div className="space-y-3">
        <p className="font-sans text-sm text-muted">
          {isConnected
            ? "Para reconectar com outra conta, gere um novo link de autorização."
            : "Gere um link seguro para autorizar a conta Mercado Pago da Dra. Vera."}
        </p>

        <button
          onClick={generateLink}
          disabled={loading}
          className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
        >
          {loading
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : isConnected
            ? <RefreshCw className="w-4 h-4" />
            : <ExternalLink className="w-4 h-4" />}
          {isConnected ? "Gerar link para reconectar" : "Gerar link de autorização"}
        </button>
      </div>

      {/* Generated link */}
      {link && (
        <div className="space-y-2">
          <p className="font-sans text-xs font-semibold text-foreground">Link gerado — sem prazo de validade:</p>
          <div className="flex gap-2">
            <input
              readOnly
              value={link}
              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-xs font-mono text-muted truncate"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 font-sans text-xs font-semibold px-3 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shrink-0"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copiado!" : "Copiar"}
            </button>
          </div>
          <p className="font-sans text-[11px] text-muted/70">
            Envie este link para Dra. Vera. Ela clica, faz login na conta MP dela e autoriza. Não há prazo — ela pode clicar quando quiser.
          </p>
        </div>
      )}
    </div>
  );
}
