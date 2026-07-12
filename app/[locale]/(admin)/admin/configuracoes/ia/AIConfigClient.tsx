"use client";

import { useState } from "react";
import { Check, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";

type ProviderKey = "ANTHROPIC" | "OPENAI" | "GOOGLE";
type ConfigState = { model: string; isActive: boolean; hasKey: boolean };

const PROVIDER_LABELS: Record<ProviderKey, { name: string; color: string; desc: string }> = {
  ANTHROPIC: { name: "Anthropic (Claude)", color: "text-orange-600", desc: "Modelos Claude da Anthropic — recomendado para conteúdo médico" },
  OPENAI:    { name: "OpenAI (GPT)",       color: "text-green-600",  desc: "Modelos GPT da OpenAI" },
  GOOGLE:    { name: "Google (Gemini)",    color: "text-blue-600",   desc: "Modelos Gemini do Google" },
};

export function AIConfigClient({
  configs,
  models,
}: {
  configs: Partial<Record<ProviderKey, ConfigState>>;
  models: Record<string, string[]>;
}) {
  const [active, setActive] = useState<ProviderKey>("ANTHROPIC");
  const [form, setForm] = useState<Record<ProviderKey, { model: string; apiKey: string; isActive: boolean }>>({
    ANTHROPIC: { model: configs.ANTHROPIC?.model ?? models.ANTHROPIC[0], apiKey: "", isActive: configs.ANTHROPIC?.isActive ?? false },
    OPENAI:    { model: configs.OPENAI?.model    ?? models.OPENAI[0],    apiKey: "", isActive: configs.OPENAI?.isActive    ?? false },
    GOOGLE:    { model: configs.GOOGLE?.model    ?? models.GOOGLE[0],    apiKey: "", isActive: configs.GOOGLE?.isActive    ?? false },
  });
  const [showKey, setShowKey] = useState<Record<ProviderKey, boolean>>({ ANTHROPIC: false, OPENAI: false, GOOGLE: false });
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [savedConfigs, setSavedConfigs] = useState(configs);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: active, model: form[active].model, apiKey: form[active].apiKey || undefined, isActive: form[active].isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao salvar");
      setSavedConfigs((prev) => ({ ...prev, [active]: { model: form[active].model, isActive: data.isActive, hasKey: true } }));
      setForm((prev) => ({ ...prev, [active]: { ...prev[active], apiKey: "" } }));
      showToast("success", "Configuração salva com sucesso!");
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleTest() {
    setTesting(true);
    try {
      const res = await fetch("/api/admin/ai-config/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: active }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Falha na conexão");
      showToast("success", `Conexão OK! Resposta: "${data.response}"`);
    } catch (err) {
      showToast("error", err instanceof Error ? err.message : "Erro na conexão");
    } finally {
      setTesting(false);
    }
  }

  const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50";
  const btnPrimary = "inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50";
  const btnGhost = "inline-flex items-center gap-2 font-sans text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-surface transition-colors disabled:opacity-50";

  return (
    <div>
      {/* Provider tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {(["ANTHROPIC", "OPENAI", "GOOGLE"] as ProviderKey[]).map((p) => (
          <button
            key={p}
            onClick={() => setActive(p)}
            className={`font-sans text-sm font-medium px-4 py-2.5 border-b-2 transition-colors -mb-px ${
              active === p ? "border-primary text-primary" : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {PROVIDER_LABELS[p].name}
            {savedConfigs[p]?.hasKey && (
              <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] font-bold text-green-600 bg-green-500/10 px-1.5 py-0.5 rounded-full">
                <Check className="w-2.5 h-2.5" /> Configurado
              </span>
            )}
            {savedConfigs[p]?.isActive && (
              <span className="ml-1 inline-flex items-center gap-0.5 text-[10px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                Ativo
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
        <p className="font-sans text-sm text-muted">{PROVIDER_LABELS[active].desc}</p>

        {/* Model */}
        <div>
          <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Modelo</label>
          <select
            value={form[active].model}
            onChange={(e) => setForm((prev) => ({ ...prev, [active]: { ...prev[active], model: e.target.value } }))}
            className={inputClass}
          >
            {(models[active] ?? []).map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">
            Chave de API {savedConfigs[active]?.hasKey && <span className="text-green-600 normal-case font-normal">(já configurada — deixe em branco para manter)</span>}
          </label>
          <div className="relative">
            <input
              type={showKey[active] ? "text" : "password"}
              value={form[active].apiKey}
              onChange={(e) => setForm((prev) => ({ ...prev, [active]: { ...prev[active], apiKey: e.target.value } }))}
              placeholder={savedConfigs[active]?.hasKey ? "••••••••••••••••" : "Cole sua chave aqui"}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowKey((prev) => ({ ...prev, [active]: !prev[active] }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
            >
              {showKey[active] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            onClick={() => setForm((prev) => ({ ...prev, [active]: { ...prev[active], isActive: !prev[active].isActive } }))}
            className={`relative w-10 h-5 rounded-full transition-colors ${form[active].isActive ? "bg-primary" : "bg-border"}`}
          >
            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form[active].isActive ? "translate-x-5" : "translate-x-0.5"}`} />
          </div>
          <span className="font-sans text-sm text-foreground">Usar como provedor ativo</span>
        </label>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <button onClick={handleSave} disabled={saving} className={btnPrimary}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Salvar configuração
          </button>
          <button onClick={handleTest} disabled={testing || !savedConfigs[active]?.hasKey} className={btnGhost}>
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Testar conexão
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg font-sans text-sm font-medium z-50 ${
          toast.type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {toast.type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
