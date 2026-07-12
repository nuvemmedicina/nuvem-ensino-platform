"use client";

import { useState, useRef } from "react";
import { Plus, Upload, Pencil, Trash2, BookOpen, Loader2, AlertTriangle, X, Check, Sparkles } from "lucide-react";

type Group = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  course: { title: string; slug: string } | null;
  _count: { cards: number };
};
type Course = { id: string; title: string; slug: string };
type DesignConfig = { backgroundValue: string; textColor: string; borderRadius: number; flipAnimation: string } | null;
type GeneratedCard = { front: string; back: string };

const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50";
const btnPrimary = "inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 font-sans text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition-colors";

export function FlashcardsAdminClient({
  groups: initial,
  courses,
}: {
  groups: Group[];
  courses: Course[];
  defaultDesign: DesignConfig;
}) {
  const [groups, setGroups] = useState(initial);
  const [modal, setModal] = useState<"manual" | "ai" | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [cardCount, setCardCount] = useState(10);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleGenerate() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setAiError("Selecione um arquivo"); return; }
    setGenerating(true);
    setAiError(null);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("count", String(cardCount));
    const res = await fetch("/api/admin/flashcards/generate", { method: "POST", body: fd });
    const data = await res.json();
    setGenerating(false);
    if (!res.ok) { setAiError(data.error ?? "Erro na geração"); return; }
    setGeneratedCards(data.flashcards ?? []);
  }

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const cards = modal === "ai" ? generatedCards : undefined;
    const res = await fetch("/api/admin/flashcards/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, courseId: courseId || null, cards }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return;
    setGroups((prev) => [{ ...data, course: courses.find((c) => c.id === courseId) ?? null }, ...prev]);
    setModal(null);
    setTitle(""); setDescription(""); setCourseId(""); setGeneratedCards([]);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este grupo de flashcards e todos os cards?")) return;
    await fetch(`/api/admin/flashcards/groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  return (
    <div>
      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => setModal("manual")} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Criar Grupo
        </button>
        <button onClick={() => setModal("ai")} className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity">
          <Sparkles className="w-4 h-4" /> Criar com IA
        </button>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-sans text-sm">Nenhum grupo de flashcards ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {groups.map((g) => (
            <div key={g.id} className="flex items-center gap-4 bg-surface border border-border rounded-xl px-5 py-4 hover:border-primary/30 transition-colors">
              <div className="flex-1 min-w-0">
                <h3 className="font-sans text-sm font-semibold text-foreground">{g.title}</h3>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="font-sans text-xs text-muted">{g._count.cards} card{g._count.cards !== 1 ? "s" : ""}</span>
                  {g.course && <span className="font-sans text-xs text-primary">📚 {g.course.title}</span>}
                  {g.tags.map((t) => <span key={t} className="font-sans text-[10px] text-muted bg-border/60 px-1.5 py-0.5 rounded">{t}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a href={`/dashboard/flashcards/${g.id}`} target="_blank" className={btnGhost} title="Ver como aluno">
                  <BookOpen className="w-3.5 h-3.5" />
                </a>
                <button className={btnGhost} title="Editar"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg text-muted/50 hover:text-red-500 hover:bg-red-500/10 transition-colors" title="Excluir">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-serif text-xl font-medium">
                {modal === "ai" ? "✨ Criar Grupo com IA" : "Criar Grupo de Flashcards"}
              </h2>
              <button onClick={() => setModal(null)} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Título do grupo *</label>
                <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex: Gastroenterologia — Módulo 1" className={inputClass} />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Descrição</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
              </div>
              <div>
                <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Vincular a um curso</label>
                <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={inputClass}>
                  <option value="">— Nenhum curso —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {modal === "ai" && (
                <div className="border border-violet-200 bg-violet-50 dark:bg-violet-900/10 dark:border-violet-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                    <Sparkles className="w-4 h-4" />
                    <p className="font-sans text-sm font-semibold">Upload de conteúdo para a IA</p>
                  </div>
                  <p className="font-sans text-xs text-muted">Aceita PDF, DOCX, TXT ou imagem. A IA gerará os flashcards automaticamente.</p>

                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer font-sans text-sm font-medium px-3 py-1.5 border border-dashed border-violet-400 rounded-lg text-violet-700 hover:bg-violet-100 transition-colors">
                      <Upload className="w-4 h-4" />
                      {fileRef.current?.files?.[0]?.name ?? "Selecionar arquivo"}
                      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.txt,image/*" onChange={() => setGeneratedCards([])} />
                    </label>
                    <div className="flex items-center gap-2">
                      <label className="font-sans text-xs text-muted">Qtd:</label>
                      <input type="number" min={5} max={50} value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value))} className="w-16 px-2 py-1 border border-border rounded-lg text-sm text-center bg-background" />
                    </div>
                    <button onClick={handleGenerate} disabled={generating} className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-50">
                      {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {generating ? "Gerando..." : "Gerar"}
                    </button>
                  </div>

                  {aiError && (
                    <div className="flex items-center gap-2 text-red-600 text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" /> {aiError}
                    </div>
                  )}

                  {/* Aviso de revisão médica */}
                  {generatedCards.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 dark:bg-amber-900/10 dark:border-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="font-sans text-xs text-amber-800 dark:text-amber-400">
                        <strong>Revisão obrigatória:</strong> Revise todo o conteúdo gerado por IA antes de publicar. A precisão clínica é de responsabilidade da coordenação do curso.
                      </p>
                    </div>
                  )}

                  {/* Generated cards preview/editor */}
                  {generatedCards.length > 0 && (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">{generatedCards.length} cards gerados — edite se necessário:</p>
                      {generatedCards.map((card, i) => (
                        <div key={i} className="bg-background border border-border rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="font-sans text-[10px] font-bold text-muted shrink-0 mt-1">FRENTE</span>
                            <textarea
                              value={card.front}
                              onChange={(e) => setGeneratedCards((prev) => prev.map((c, j) => j === i ? { ...c, front: e.target.value } : c))}
                              rows={2}
                              className="flex-1 text-xs border border-border rounded px-2 py-1 bg-surface resize-none focus:outline-none"
                            />
                            <button onClick={() => setGeneratedCards((prev) => prev.filter((_, j) => j !== i))} className="text-muted/40 hover:text-red-500 shrink-0"><X className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-sans text-[10px] font-bold text-muted shrink-0 mt-1">VERSO</span>
                            <textarea
                              value={card.back}
                              onChange={(e) => setGeneratedCards((prev) => prev.map((c, j) => j === i ? { ...c, back: e.target.value } : c))}
                              rows={2}
                              className="flex-1 text-xs border border-border rounded px-2 py-1 bg-surface resize-none focus:outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button onClick={() => setModal(null)} className={btnGhost}>Cancelar</button>
                <button
                  onClick={handleSave}
                  disabled={saving || !title.trim() || (modal === "ai" && generatedCards.length === 0)}
                  className={btnPrimary}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Salvar grupo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
