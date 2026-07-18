"use client";

import { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle, Clock, XCircle, Download } from "lucide-react";

type Row = {
  id: string;
  asaasId: string | null;
  paymentStatus: string;
  enrollmentStatus: string;
  enrollmentId: string;
  amount: number;
  method: string;
  paidAt: string | null;
  createdAt: string;
  email: string;
  userName: string;
  course: string;
  divergent: boolean;
};

const PAYMENT_LABELS: Record<string, { label: string; color: string }> = {
  PAID:     { label: "Pago",      color: "bg-green-100 text-green-800" },
  PENDING:  { label: "Pendente",  color: "bg-yellow-100 text-yellow-800" },
  FAILED:   { label: "Falhou",    color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolso", color: "bg-purple-100 text-purple-800" },
};

const ENROLLMENT_LABELS: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Ativa",      color: "bg-green-100 text-green-800" },
  PENDING:   { label: "Pendente",   color: "bg-yellow-100 text-yellow-800" },
  CANCELLED: { label: "Cancelada",  color: "bg-red-100 text-red-800" },
  SUSPENDED: { label: "Suspensa",   color: "bg-orange-100 text-orange-800" },
  REFUNDED:  { label: "Reembolso",  color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Concluída",  color: "bg-blue-100 text-blue-800" },
};

function Chip({ value, map }: { value: string; map: Record<string, { label: string; color: string }> }) {
  const cfg = map[value] ?? { label: value, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

export function PagamentosClient({ rows, divergent }: { rows: Row[]; divergent: number }) {
  const [filter, setFilter] = useState<"all" | "divergent">("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fixed: number; dryRun: boolean } | null>(null);

  const displayed = filter === "divergent" ? rows.filter((r) => r.divergent) : rows;

  async function runReconcile(dryRun: boolean) {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/reconcile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dryRun }),
      });
      const data = await res.json();
      setResult({ fixed: data.fixed, dryRun });
      if (!dryRun) window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

  const fmtBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-serif text-2xl font-light text-foreground">Pagamentos</h1>
          <p className="text-sm text-muted mt-1">
            {rows.length} registros · {" "}
            {divergent > 0 ? (
              <span className="text-orange-600 font-semibold">{divergent} divergentes</span>
            ) : (
              <span className="text-green-600 font-semibold">nenhuma divergência</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => runReconcile(true)}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Verificar (simulação)
          </button>
          <button
            onClick={() => runReconcile(false)}
            disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Conciliar agora
          </button>
        </div>
      </div>

      {/* Result banner */}
      {result && (
        <div className={`flex items-center gap-3 p-4 rounded-xl mb-6 text-sm font-medium ${result.fixed === 0 ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
          {result.fixed === 0
            ? <><CheckCircle className="w-5 h-5" /> Nenhuma divergência encontrada — tudo está correto.</>
            : result.dryRun
              ? <><AlertTriangle className="w-5 h-5" /> Simulação: {result.fixed} matrículas seriam corrigidas. Clique em "Conciliar agora" para aplicar.</>
              : <><CheckCircle className="w-5 h-5" /> {result.fixed} matrículas corrigidas com sucesso.</>
          }
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setFilter("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${filter === "all" ? "bg-primary text-white" : "text-muted hover:text-foreground"}`}
        >
          Todos ({rows.length})
        </button>
        <button
          onClick={() => setFilter("divergent")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${filter === "divergent" ? "bg-orange-500 text-white" : "text-muted hover:text-foreground"}`}
        >
          Divergentes ({divergent})
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-background/50">
                <th className="text-left text-xs font-semibold text-muted px-4 py-3">Aluno</th>
                <th className="text-left text-xs font-semibold text-muted px-4 py-3">Curso</th>
                <th className="text-left text-xs font-semibold text-muted px-4 py-3">Valor</th>
                <th className="text-left text-xs font-semibold text-muted px-4 py-3">Método</th>
                <th className="text-left text-xs font-semibold text-muted px-4 py-3">Pagamento</th>
                <th className="text-left text-xs font-semibold text-muted px-4 py-3">Matrícula</th>
                <th className="text-left text-xs font-semibold text-muted px-4 py-3">Data</th>
              </tr>
            </thead>
            <tbody>
              {displayed.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-12 text-sm">
                    Nenhum registro encontrado
                  </td>
                </tr>
              )}
              {displayed.map((r) => (
                <tr key={r.id} className={`border-t border-border hover:bg-background/40 transition-colors ${r.divergent ? "bg-orange-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-xs">{r.userName || "—"}</div>
                    <div className="text-muted text-xs">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground max-w-[180px] truncate">{r.course}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-foreground font-mono">{fmtBRL(r.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted uppercase">{r.method}</td>
                  <td className="px-4 py-3">
                    <Chip value={r.paymentStatus} map={PAYMENT_LABELS} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Chip value={r.enrollmentStatus} map={ENROLLMENT_LABELS} />
                      {r.divergent && <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{fmt(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
