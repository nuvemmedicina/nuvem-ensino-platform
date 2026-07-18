"use client";

import { useState, useRef } from "react";
import { Plus, Upload, Pencil, Trash2, BookOpen, Loader2, AlertTriangle, X, Check, Sparkles, LayersIcon } from "lucide-react";

type Group = {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  course: { title: string; slug: string; thumbnailUrl: string | null } | null;
  _count: { cards: number };
};
type Course = { id: string; title: string; slug: string };
type DesignConfig = { backgroundValue: string; textColor: string; borderRadius: number; flipAnimation: string } | null;
type GeneratedCard = { front: string; back: string };

const inputClass = "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:border-primary/50";
const btnPrimary = "inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50";
const btnGhost = "inline-flex items-center gap-2 font-sans text-sm font-medium px-3 py-1.5 rounded-lg border border-border hover:bg-surface transition-colors";

/* Stacked-cards illustration rendered inside the poster area */
function FlashcardIllustration({ count }: { count: number }) {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* back card */}
      <div className="absolute w-28 h-20 rounded-xl border border-white/20 bg-white/10 rotate-6 translate-y-1" />
      {/* middle card */}
      <div className="absolute w-28 h-20 rounded-xl border border-white/25 bg-white/15 rotate-2" />
      {/* front card */}
      <div className="absolute w-28 h-20 rounded-xl border border-white/40 bg-white/25 -rotate-2 flex flex-col items-center justify-center gap-1.5 shadow-lg">
        <LayersIcon className="w-5 h-5 text-white/70" />
        <span className="font-sans text-[11px] font-bold text-white/80 tabular-nums">{count} card{count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

export function FlashcardsAdminClient({
  groups: initial,
  courses,
}: {
  groups: Group[];
  courses: Course[];
  defaultDesign: DesignConfig;
}) {
  const [groups, setGroups] = useState(initial);
  const [modal, setModal] = useState<"manual" | "ai" | "edit" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseId, setCourseId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [cardCount, setCardCount] = useState(10);
  const [aiError, setAiError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleGenerate() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setAiError("Selecione um arquivo"); return; }
    setGenerating(true);
    setAiError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("count", String(cardCount));
      const res = await fetch("/api/admin/flashcards/generate", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? "Erro na geração"); return; }
      setGeneratedCards(data.flashcards ?? []);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setGenerating(false);
    }
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
    const linkedCourse = courses.find((c) => c.id === courseId);
    setGroups((prev) => [{ ...data, course: linkedCourse ? { ...linkedCourse, thumbnailUrl: null } : null }, ...prev]);
    setModal(null);
    setTitle(""); setDescription(""); setCourseId(""); setGeneratedCards([]); setFileName(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este grupo de flashcards e todos os cards?")) return;
    await fetch(`/api/admin/flashcards/groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function openAI() { setModal("ai"); setGeneratedCards([]); setAiError(null); setFileName(null); }

  function openEdit(g: Group) {
    setEditingId(g.id);
    setTitle(g.title);
    setDescription(g.description ?? "");
    setCourseId(g.course ? courses.find((c) => c.slug === g.course!.slug)?.id ?? "" : "");
    setModal("edit");
  }

  async function handleUpdate() {
    if (!editingId || !title.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/admin/flashcards/groups/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description: description || null, courseId: courseId || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return;
    const linkedCourse = courses.find((c) => c.id === courseId);
    setGroups((prev) => prev.map((g) => g.id === editingId
      ? { ...g, title: data.title, description: data.description, course: linkedCourse ? { ...linkedCourse, thumbnailUrl: g.course?.thumbnailUrl ?? null } : null }
      : g
    ));
    closeModal();
  }

  function closeModal() { setModal(null); setTitle(""); setDescription(""); setCourseId(""); setGeneratedCards([]); setAiError(null); setFileName(null); setEditingId(null); }

  return (
    <div>
      {/* Action buttons */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => setModal("manual")} className={btnPrimary}>
          <Plus className="w-4 h-4" /> Criar Grupo
        </button>
        <button onClick={openAI} className="inline-flex items-center gap-2 font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:opacity-90 transition-opacity">
          <Sparkles className="w-4 h-4" /> Criar com IA
        </button>
      </div>

      {/* Netflix grid */}
      {groups.length === 0 ? (
        <div className="text-center py-24 text-muted">
          <LayersIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-sans text-sm">Nenhum grupo de flashcards ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {groups.map((g) => {
            const thumb = g.course?.thumbnailUrl ?? null;
            return (
              <div key={g.id} className="group relative flex flex-col rounded-xl overflow-hidden border border-border bg-surface hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">

                {/* Poster thumbnail area */}
                <div className="relative aspect-[2/3] shrink-0 overflow-hidden bg-gradient-to-b from-violet-900 to-indigo-950">
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={g.title} className="absolute inset-0 w-full h-full object-cover opacity-40" />
                  ) : null}

                  {/* gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                  {/* Card count badge */}
                  <span className="absolute top-2.5 left-2.5 font-sans text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-violet-500/90 text-white">
                    {g._count.cards} cards
                  </span>

                  {/* Stacked cards illustration */}
                  <FlashcardIllustration count={g._count.cards} />

                  {/* Hover actions overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a
                      href={`/dashboard/flashcards/${g.id}`}
                      target="_blank"
                      className="flex items-center gap-1.5 font-sans text-[11px] font-bold px-3 py-1.5 rounded-lg bg-white text-zinc-900 hover:bg-white/90 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" /> Estudar
                    </a>
                    <button
                      onClick={() => openEdit(g)}
                      className="flex items-center gap-1.5 font-sans text-[11px] font-bold px-3 py-1.5 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                  </div>

                  {/* Course name at bottom of poster */}
                  {g.course && (
                    <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
                      <p className="font-sans text-[10px] text-white/60 truncate">📚 {g.course.title}</p>
                    </div>
                  )}
                </div>

                {/* Card body */}
                <div className="flex flex-col gap-2 px-3 py-2.5 flex-1">
                  <h2 className="font-serif text-sm font-medium text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {g.title}
                  </h2>

                  {g.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {g.tags.map((t) => (
                        <span key={t} className="font-sans text-[9px] text-muted bg-border/60 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}

                  {/* Delete button */}
                  <div className="flex items-center gap-1 border-t border-border/50 pt-2 -mx-3 px-3 mt-auto">
                    <button
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded-md text-muted/50 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-background border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-serif text-xl font-medium">
                {modal === "ai" ? "✨ Criar Grupo com IA" : modal === "edit" ? "Editar Grupo" : "Criar Grupo de Flashcards"}
              </h2>
              <button onClick={closeModal} className="text-muted hover:text-foreground"><X className="w-5 h-5" /></button>
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

                  <div className="flex items-center gap-3 flex-wrap">
                    <label className="flex items-center gap-2 cursor-pointer font-sans text-sm font-medium px-3 py-1.5 border border-dashed border-violet-400 rounded-lg text-violet-700 hover:bg-violet-100 transition-colors">
                      <Upload className="w-4 h-4" />
                      {fileName ?? "Selecionar arquivo"}
                      <input
                        ref={fileRef}
                        type="file"
                        className="hidden"
                        accept=".pdf,.docx,.txt,image/*"
                        onChange={(e) => { setGeneratedCards([]); setFileName(e.target.files?.[0]?.name ?? null); }}
                      />
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

                  {generatedCards.length > 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 dark:bg-amber-900/10 dark:border-amber-800">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p className="font-sans text-xs text-amber-800 dark:text-amber-400">
                        <strong>Revisão obrigatória:</strong> Revise todo o conteúdo gerado por IA antes de publicar. A precisão clínica é de responsabilidade da coordenação do curso.
                      </p>
                    </div>
                  )}

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
                <button onClick={closeModal} className={btnGhost}>Cancelar</button>
                <button
                  onClick={modal === "edit" ? handleUpdate : handleSave}
                  disabled={saving || !title.trim() || (modal === "ai" && generatedCards.length === 0)}
                  className={btnPrimary}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {modal === "edit" ? "Salvar alterações" : "Salvar grupo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
