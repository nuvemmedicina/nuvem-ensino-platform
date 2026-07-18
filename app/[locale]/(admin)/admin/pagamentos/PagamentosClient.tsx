"use client";

import { useState, useRef, useEffect } from "react";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";

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

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });

const METHOD_LABEL: Record<string, string> = {
  ASAAS_CARD: "Cartão", ASAAS_PIX: "PIX", ASAAS_BOLETO: "Boleto",
  CREDIT_CARD: "Cartão", PIX: "PIX", BOLETO: "Boleto",
};

const PAYMENT_MAP: Record<string, { label: string; color: string }> = {
  PAID:     { label: "Pago",      color: "bg-green-100 text-green-800" },
  PENDING:  { label: "Pendente",  color: "bg-yellow-100 text-yellow-800" },
  FAILED:   { label: "Falhou",    color: "bg-red-100 text-red-800" },
  REFUNDED: { label: "Reembolso", color: "bg-purple-100 text-purple-800" },
};

const ENROLLMENT_MAP: Record<string, { label: string; color: string }> = {
  ACTIVE:    { label: "Ativa",     color: "bg-green-100 text-green-800" },
  PENDING:   { label: "Pendente",  color: "bg-yellow-100 text-yellow-800" },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-800" },
  SUSPENDED: { label: "Suspensa",  color: "bg-orange-100 text-orange-800" },
  REFUNDED:  { label: "Reembolso", color: "bg-purple-100 text-purple-800" },
  COMPLETED: { label: "Concluída", color: "bg-blue-100 text-blue-800" },
};

function Chip({ value, map }: { value: string; map: Record<string, { label: string; color: string }> }) {
  const c = map[value] ?? { label: value, color: "bg-gray-100 text-gray-700" };
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${c.color}`}>{c.label}</span>;
}

// ── KPI tile ─────────────────────────────────────────────────────────────────

function KpiTile({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-1">
      <span className="text-[11px] font-semibold uppercase tracking-widest text-muted">{label}</span>
      <span className={`text-2xl font-bold tabular-nums ${accent ?? "text-foreground"}`}>{value}</span>
      {sub && <span className="text-xs text-muted">{sub}</span>}
    </div>
  );
}

// ── Bar chart (SVG) ───────────────────────────────────────────────────────────

type Bar = { label: string; value: number; color: string };

function BarChart({ bars, height = 160, title }: { bars: Bar[]; height?: number; title: string }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; bar: Bar } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const max = Math.max(...bars.map((b) => b.value), 1);
  const W = 400; const PAD_L = 8; const PAD_R = 8; const PAD_T = 8; const PAD_B = 28;
  const chartH = height - PAD_T - PAD_B;
  const barW = Math.max(8, (W - PAD_L - PAD_R) / bars.length - 6);
  const gap = (W - PAD_L - PAD_R - barW * bars.length) / Math.max(bars.length - 1, 1);

  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3 relative">
      <span className="text-xs font-semibold text-muted uppercase tracking-wide">{title}</span>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${height}`}
        className="w-full overflow-visible"
        style={{ height }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* grid lines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f}
            x1={PAD_L} x2={W - PAD_R}
            y1={PAD_T + chartH * (1 - f)} y2={PAD_T + chartH * (1 - f)}
            stroke="#e5e7eb" strokeWidth="1" strokeDasharray="3 3" />
        ))}
        {/* baseline */}
        <line x1={PAD_L} x2={W - PAD_R} y1={PAD_T + chartH} y2={PAD_T + chartH} stroke="#d1d5db" strokeWidth="1" />

        {bars.map((b, i) => {
          const bh = Math.max(2, (b.value / max) * chartH);
          const x = PAD_L + i * (barW + gap);
          const y = PAD_T + chartH - bh;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={bh} rx="3"
                fill={b.color} fillOpacity="0.9"
                className="cursor-pointer transition-opacity hover:opacity-75"
                onMouseEnter={(e) => {
                  const svg = svgRef.current!;
                  const rect = svg.getBoundingClientRect();
                  const scaleX = rect.width / W;
                  setTooltip({ x: (x + barW / 2) * scaleX, y: y * (rect.height / height), bar: b });
                }}
              />
              <text
                x={x + barW / 2} y={PAD_T + chartH + 14}
                textAnchor="middle" fontSize="9" fill="#6b7280" fontFamily="system-ui"
              >
                {b.label.length > 6 ? b.label.slice(0, 5) + "…" : b.label}
              </text>
            </g>
          );
        })}
      </svg>
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-foreground text-white text-xs rounded-lg px-3 py-2 shadow-lg"
          style={{ left: tooltip.x + 12, top: tooltip.y, transform: "translateY(-50%)" }}
        >
          <div className="font-semibold">{tooltip.bar.label}</div>
          <div className="opacity-80">{fmtBRL(tooltip.bar.value)}</div>
        </div>
      )}
    </div>
  );
}

// ── Horizontal bar chart ──────────────────────────────────────────────────────

function HBarChart({ bars, title }: { bars: Bar[]; title: string }) {
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="bg-white rounded-2xl border border-border p-5 flex flex-col gap-3">
      <span className="text-xs font-semibold text-muted uppercase tracking-wide">{title}</span>
      <div className="flex flex-col gap-2.5">
        {bars.map((b, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-xs text-muted w-20 text-right shrink-0 truncate" title={b.label}>{b.label}</span>
            <div className="flex-1 h-5 bg-border/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(b.value / max) * 100}%`, backgroundColor: b.color }}
              />
            </div>
            <span className="text-xs font-semibold text-foreground tabular-nums w-24 shrink-0">{fmtBRL(b.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PagamentosClient({ rows, divergent }: { rows: Row[]; divergent: number }) {
  const [filter, setFilter] = useState<"all" | "divergent">("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ fixed: number; dryRun: boolean } | null>(null);

  // ── analytics ──────────────────────────────────────────────────────────────
  const paidRows = rows.filter((r) => r.paymentStatus === "PAID");
  const totalRevenue = paidRows.reduce((s, r) => s + r.amount, 0);
  const avgTicket = paidRows.length ? totalRevenue / paidRows.length : 0;

  // receita por mês (últimos 6 meses)
  const now = new Date();
  const monthBars: Bar[] = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const value = paidRows
      .filter((r) => r.createdAt.startsWith(key))
      .reduce((s, r) => s + r.amount, 0);
    return { label: label.charAt(0).toUpperCase() + label.slice(1), value, color: "#00475E" };
  });

  // por método
  const methodMap: Record<string, number> = {};
  paidRows.forEach((r) => {
    const label = METHOD_LABEL[r.method] ?? r.method;
    methodMap[label] = (methodMap[label] ?? 0) + r.amount;
  });
  const METHOD_COLORS: Record<string, string> = { PIX: "#00475E", Cartão: "#F59E0B", Boleto: "#64748B" };
  const methodBars: Bar[] = Object.entries(methodMap)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, color: METHOD_COLORS[label] ?? "#94a3b8" }));

  // top 5 cursos por receita
  const courseMap: Record<string, number> = {};
  paidRows.forEach((r) => { courseMap[r.course] = (courseMap[r.course] ?? 0) + r.amount; });
  const courseBars: Bar[] = Object.entries(courseMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value], i) => ({
      label: label.length > 22 ? label.slice(0, 20) + "…" : label,
      value,
      color: ["#00475E", "#005f7a", "#006d8f", "#007ba4", "#0089b9"][i],
    }));

  // ── reconcile ──────────────────────────────────────────────────────────────
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

  const displayed = filter === "divergent" ? rows.filter((r) => r.divergent) : rows;

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-light text-foreground">Pagamentos</h1>
          <p className="text-sm text-muted mt-1">
            {rows.length} registros ·{" "}
            {divergent > 0
              ? <span className="text-orange-600 font-semibold">{divergent} divergentes</span>
              : <span className="text-green-600 font-semibold">nenhuma divergência</span>}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => runReconcile(true)} disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg border border-border text-foreground hover:bg-background transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Verificar (simulação)
          </button>
          <button onClick={() => runReconcile(false)} disabled={loading}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Conciliar agora
          </button>
        </div>
      </div>

      {/* ── Result banner ── */}
      {result && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${result.fixed === 0 ? "bg-green-50 text-green-800 border border-green-200" : "bg-amber-50 text-amber-800 border border-amber-200"}`}>
          {result.fixed === 0
            ? <><CheckCircle className="w-5 h-5" /> Nenhuma divergência encontrada.</>
            : result.dryRun
              ? <><AlertTriangle className="w-5 h-5" /> Simulação: {result.fixed} matrículas seriam corrigidas. Clique em "Conciliar agora" para aplicar.</>
              : <><CheckCircle className="w-5 h-5" /> {result.fixed} matrículas corrigidas com sucesso.</>}
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile label="Total arrecadado" value={fmtBRL(totalRevenue)} sub={`${paidRows.length} pagamentos confirmados`} accent="text-primary" />
        <KpiTile label="Ticket médio" value={fmtBRL(avgTicket)} sub="por pagamento pago" />
        <KpiTile label="Total de registros" value={String(rows.length)} sub={`${rows.filter(r => r.paymentStatus === "PENDING").length} aguardando pagamento`} />
        <KpiTile
          label="Divergências"
          value={String(divergent)}
          sub={divergent === 0 ? "tudo conciliado" : "pago mas matrícula inativa"}
          accent={divergent > 0 ? "text-orange-600" : "text-green-600"}
        />
      </div>

      {/* ── Charts row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <BarChart bars={monthBars} title="Receita mensal (R$)" height={180} />
        </div>
        <HBarChart bars={methodBars.length ? methodBars : [{ label: "Sem dados", value: 0, color: "#94a3b8" }]} title="Por método de pagamento" />
      </div>

      {courseBars.length > 0 && (
        <HBarChart bars={courseBars} title="Top cursos por receita" />
      )}

      {/* ── Filter tabs ── */}
      <div className="flex gap-1">
        <button onClick={() => setFilter("all")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${filter === "all" ? "bg-primary text-white" : "text-muted hover:text-foreground"}`}>
          Todos ({rows.length})
        </button>
        <button onClick={() => setFilter("divergent")}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${filter === "divergent" ? "bg-orange-500 text-white" : "text-muted hover:text-foreground"}`}>
          Divergentes ({divergent})
        </button>
      </div>

      {/* ── Table ── */}
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
                <tr><td colSpan={7} className="text-center text-muted py-12 text-sm">Nenhum registro encontrado</td></tr>
              )}
              {displayed.map((r) => (
                <tr key={r.id} className={`border-t border-border hover:bg-background/40 transition-colors ${r.divergent ? "bg-orange-50/40" : ""}`}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground text-xs">{r.userName || "—"}</div>
                    <div className="text-muted text-xs">{r.email}</div>
                  </td>
                  <td className="px-4 py-3 text-xs text-foreground max-w-[180px] truncate">{r.course}</td>
                  <td className="px-4 py-3 text-xs font-semibold text-foreground font-mono">{fmtBRL(r.amount)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{METHOD_LABEL[r.method] ?? r.method}</td>
                  <td className="px-4 py-3"><Chip value={r.paymentStatus} map={PAYMENT_MAP} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Chip value={r.enrollmentStatus} map={ENROLLMENT_MAP} />
                      {r.divergent && <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted">{fmtDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
