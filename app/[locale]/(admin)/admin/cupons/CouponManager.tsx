"use client";

import { useState, useTransition } from "react";
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, X, Loader2, Check } from "lucide-react";
import { createCoupon, updateCoupon, toggleCoupon, deleteCoupon } from "./actions";

type Coupon = {
  id: string;
  code: string;
  discountPct: number | null;
  discountFlat: string | null;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

type FormState = {
  open: boolean;
  editing: Coupon | null;
};

const emptyForm = {
  code: "",
  type: "pct" as "pct" | "flat",
  discountPct: "",
  discountFlat: "",
  maxUses: "",
  expiresAt: "",
  active: true,
};

export default function CouponManager({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [form, setForm] = useState<FormState>({ open: false, editing: null });
  const [fields, setFields] = useState(emptyForm);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fmtBRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

  function openCreate() {
    setFields(emptyForm);
    setError("");
    setForm({ open: true, editing: null });
  }

  function openEdit(c: Coupon) {
    setFields({
      code:        c.code,
      type:        c.discountPct !== null ? "pct" : "flat",
      discountPct: c.discountPct?.toString() ?? "",
      discountFlat: c.discountFlat?.toString() ?? "",
      maxUses:     c.maxUses?.toString() ?? "",
      expiresAt:   c.expiresAt ? c.expiresAt.slice(0, 10) : "",
      active:      c.active,
    });
    setError("");
    setForm({ open: true, editing: c });
  }

  function close() {
    setForm({ open: false, editing: null });
    setError("");
  }

  function handleSubmit() {
    setError("");
    startTransition(async () => {
      try {
        const payload = {
          code:         fields.code,
          discountPct:  fields.type === "pct"  && fields.discountPct  ? Number(fields.discountPct)  : null,
          discountFlat: fields.type === "flat" && fields.discountFlat ? Number(fields.discountFlat) : null,
          maxUses:      fields.maxUses  ? Number(fields.maxUses)  : null,
          expiresAt:    fields.expiresAt || null,
        };

        if (form.editing) {
          await updateCoupon(form.editing.id, { ...payload, active: fields.active });
        } else {
          await createCoupon(payload);
        }
        close();
        // optimistic: refresh via revalidate (server action triggers)
      } catch (e: unknown) {
        setError((e as Error).message ?? "Erro ao salvar");
      }
    });
  }

  function handleToggle(c: Coupon) {
    setTogglingId(c.id);
    startTransition(async () => {
      await toggleCoupon(c.id, !c.active);
      setCoupons((prev) =>
        prev.map((x) => (x.id === c.id ? { ...x, active: !c.active } : x)),
      );
      setTogglingId(null);
    });
  }

  function handleDelete(c: Coupon) {
    if (!confirm(`Excluir o cupom "${c.code}"? Esta ação não pode ser desfeita.`)) return;
    setDeletingId(c.id);
    startTransition(async () => {
      await deleteCoupon(c.id);
      setCoupons((prev) => prev.filter((x) => x.id !== c.id));
      setDeletingId(null);
    });
  }

  return (
    <div>
      {/* Botão novo */}
      <div className="flex items-center justify-between mb-6">
        <p className="font-sans text-sm text-muted">{coupons.length} cupom(ns) cadastrado(s)</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo cupom
        </button>
      </div>

      {/* Tabela */}
      {coupons.length === 0 ? (
        <div className="bg-surface border border-border rounded-2xl px-5 py-16 text-center">
          <p className="font-sans text-sm text-muted">Nenhum cupom cadastrado ainda.</p>
          <button
            onClick={openCreate}
            className="mt-4 font-sans text-sm font-semibold text-primary hover:underline"
          >
            Criar primeiro cupom →
          </button>
        </div>
      ) : (
        <div className="bg-surface border border-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-background">
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Código</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Desconto</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden sm:table-cell">Usos</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider hidden md:table-cell">Validade</th>
                  <th className="px-5 py-3 text-left font-sans text-xs font-semibold text-muted uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3 text-right font-sans text-xs font-semibold text-muted uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-background/50 transition-colors">
                    {/* Código */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-foreground">{c.code}</span>
                    </td>

                    {/* Desconto */}
                    <td className="px-5 py-3.5">
                      <span className="font-sans text-sm font-semibold text-primary">
                        {c.discountPct !== null
                          ? `${c.discountPct}% off`
                          : c.discountFlat !== null
                          ? `− ${fmtBRL.format(Number(c.discountFlat))}`
                          : "—"}
                      </span>
                    </td>

                    {/* Usos */}
                    <td className="px-5 py-3.5 hidden sm:table-cell">
                      <span className="font-sans text-sm text-muted">
                        {c.usesCount}
                        {c.maxUses !== null ? ` / ${c.maxUses}` : ""}
                      </span>
                    </td>

                    {/* Validade */}
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="font-sans text-xs text-muted">
                        {c.expiresAt
                          ? new Intl.DateTimeFormat("pt-BR").format(new Date(c.expiresAt))
                          : "Sem expiração"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleToggle(c)}
                        disabled={togglingId === c.id}
                        className="flex items-center gap-1.5 transition-colors"
                      >
                        {togglingId === c.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-muted" />
                        ) : c.active ? (
                          <ToggleRight className="w-5 h-5 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-5 h-5 text-muted/40" />
                        )}
                        <span className={`font-sans text-xs font-semibold ${c.active ? "text-green-600" : "text-muted/50"}`}>
                          {c.active ? "Ativo" : "Inativo"}
                        </span>
                      </button>
                    </td>

                    {/* Ações */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/50 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c)}
                          disabled={deletingId === c.id}
                          className="p-1.5 rounded-lg text-muted hover:text-red-500 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                          title="Excluir"
                        >
                          {deletingId === c.id
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Trash2 className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal criar/editar */}
      {form.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl font-medium text-foreground">
                {form.editing ? "Editar cupom" : "Novo cupom"}
              </h2>
              <button onClick={close} className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-border/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Código */}
              <div>
                <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Código do cupom *
                </label>
                <input
                  value={fields.code}
                  onChange={(e) => setFields((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="Ex: DESCONTO20"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background font-mono text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
                />
              </div>

              {/* Tipo de desconto */}
              <div>
                <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                  Tipo de desconto *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["pct", "flat"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setFields((f) => ({ ...f, type: t }))}
                      className={`py-2.5 rounded-lg border font-sans text-sm font-semibold transition-all ${
                        fields.type === t
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted hover:border-primary/30"
                      }`}
                    >
                      {t === "pct" ? "Percentual (%)" : "Valor fixo (R$)"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Valor do desconto */}
              {fields.type === "pct" ? (
                <div>
                  <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Percentual de desconto *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={fields.discountPct}
                      onChange={(e) => setFields((f) => ({ ...f, discountPct: e.target.value }))}
                      placeholder="Ex: 20"
                      className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 font-sans text-sm text-muted">%</span>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Valor do desconto *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-sans text-sm text-muted">R$</span>
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={fields.discountFlat}
                      onChange={(e) => setFields((f) => ({ ...f, discountFlat: e.target.value }))}
                      placeholder="Ex: 50.00"
                      className="w-full px-3 py-2.5 pl-9 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              )}

              {/* Limite de usos + Validade (lado a lado) */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Limite de usos
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={fields.maxUses}
                    onChange={(e) => setFields((f) => ({ ...f, maxUses: e.target.value }))}
                    placeholder="Ilimitado"
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/40 focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div>
                  <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
                    Expira em
                  </label>
                  <input
                    type="date"
                    value={fields.expiresAt}
                    onChange={(e) => setFields((f) => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50"
                  />
                </div>
              </div>

              {/* Ativo (só na edição) */}
              {form.editing && (
                <div className="flex items-center justify-between py-2">
                  <span className="font-sans text-sm text-foreground">Cupom ativo</span>
                  <button
                    type="button"
                    onClick={() => setFields((f) => ({ ...f, active: !f.active }))}
                    className="flex items-center gap-2"
                  >
                    {fields.active ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-muted/40" />
                    )}
                    <span className={`font-sans text-sm font-semibold ${fields.active ? "text-green-600" : "text-muted/50"}`}>
                      {fields.active ? "Ativo" : "Inativo"}
                    </span>
                  </button>
                </div>
              )}

              {error && (
                <p className="font-sans text-xs text-red-500">{error}</p>
              )}
            </div>

            {/* Botões */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={close}
                className="flex-1 font-sans text-sm font-semibold px-4 py-2.5 rounded-xl border border-border text-muted hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-2 font-sans text-sm font-semibold px-4 py-2.5 rounded-xl bg-primary text-white hover:bg-primary-dark disabled:opacity-60 transition-colors"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {form.editing ? "Salvar alterações" : "Criar cupom"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
