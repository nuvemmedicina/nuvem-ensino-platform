"use client";

import { useState, useRef } from "react";
import { uploadFileToBlob } from "@/app/actions/uploadToBlob";
import { Plus, Upload, Pencil, Trash2, BookOpen, Loader2, AlertTriangle, X, Check, Sparkles, LayersIcon, Lock } from "lucide-react";
import { moduleColor, type ModuleColor } from "@/lib/moduleColors";

type Group = {
  id: string;
  title: string;
  description: string | null;
  topicId: string | null;
  imageUrl: string | null;
  tags: string[];
  course: { title: string; slug: string; thumbnailUrl: string | null } | null;
  _count: { cards: number };
};
type Topic = { id: string; title: string };
type Module = { id: string; title: string; topics: Topic[] };
type Course = { id: string; title: string; slug: string; modules: Module[] };
type DesignConfig = { backgroundValue: string; textColor: string; borderRadius: number; flipAnimation: string } | null;
type GeneratedCard = { front: string; back: string };
/** Card já salvo, em edição. Sem id = acabou de ser acrescentado na tela. */
type EditableCard = { id?: string; front: string; back: string };

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
  const [editCards, setEditCards] = useState<EditableCard[]>([]);
  const [loadingCards, setLoadingCards] = useState(false);
  const [topicId, setTopicId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [enviandoImagem, setEnviandoImagem] = useState(false);
  const imagemRef = useRef<HTMLInputElement>(null);

  async function enviarImagem(file: File) {
    setEnviandoImagem(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      setImageUrl(await uploadFileToBlob(fd));
    } catch {
      /* mantém a imagem anterior */
    }
    setEnviandoImagem(false);
  }

  async function handleGenerate() {
    const file = fileRef.current?.files?.[0];
    if (!file) { setAiError("Selecione um arquivo"); return; }
    setGenerating(true);
    setAiError(null);

    try {
      const fd = new FormData();
      fd.append("file", file);
      const blobUrl = await uploadFileToBlob(fd);
      const res = await fetch("/api/admin/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blobUrl, filename: file.name, mimeType: file.type, count: cardCount }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error ?? "Erro na geração"); return; }
      setGeneratedCards(data.flashcards ?? []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setAiError(msg || "Erro ao gerar flashcards. Tente novamente.");
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
      body: JSON.stringify({
        title, description,
        courseId: courseId || null,
        topicId: topicId || null,
        imageUrl: imageUrl || null,
        cards,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return;
    const linkedCourse = courses.find((c) => c.id === courseId);
    setGroups((prev) => [{ ...data, course: linkedCourse ? { ...linkedCourse, thumbnailUrl: null } : null }, ...prev]);
    setModal(null);
    setTitle(""); setDescription(""); setCourseId(""); setTopicId(""); setImageUrl(""); setGeneratedCards([]); setFileName(null);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este grupo de flashcards e todos os cards?")) return;
    await fetch(`/api/admin/flashcards/groups/${id}`, { method: "DELETE" });
    setGroups((prev) => prev.filter((g) => g.id !== id));
  }

  function openAI() { setModal("ai"); setGeneratedCards([]); setAiError(null); setFileName(null); }

  async function openEdit(g: Group) {
    setEditingId(g.id);
    setTitle(g.title);
    setDescription(g.description ?? "");
    setCourseId(g.course ? courses.find((c) => c.slug === g.course!.slug)?.id ?? "" : "");
    setTopicId(g.topicId ?? "");
    setImageUrl(g.imageUrl ?? "");
    setEditCards([]);
    setModal("edit");

    // Os cards não vêm na listagem — busca sob demanda ao abrir a edição.
    setLoadingCards(true);
    try {
      const res = await fetch(`/api/admin/flashcards/groups/${g.id}`);
      if (res.ok) {
        const data = await res.json() as { cards: EditableCard[] };
        setEditCards(data.cards.map((c) => ({ id: c.id, front: c.front, back: c.back })));
      }
    } catch { /* deixa a lista vazia; o resto da edição continua funcionando */ }
    setLoadingCards(false);
  }

  function alterarCard(i: number, campo: "front" | "back", valor: string) {
    setEditCards((prev) => prev.map((c, j) => (j === i ? { ...c, [campo]: valor } : c)));
  }

  async function handleUpdate() {
    if (!editingId || !title.trim()) return;
    // Card em branco seria salvo vazio e apareceria assim para o aluno.
    const cards = editCards.filter((c) => c.front.trim() && c.back.trim());
    setSaving(true);
    const res = await fetch(`/api/admin/flashcards/groups/${editingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description: description || null,
        courseId: courseId || null,
        topicId: topicId || null,
        imageUrl: imageUrl || null,
        cards,
      }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return;
    const linkedCourse = courses.find((c) => c.id === (data.courseId ?? courseId));
    setGroups((prev) => prev.map((g) => g.id === editingId
      ? {
          ...g,
          title: data.title,
          description: data.description,
          topicId: data.topicId ?? null,
          imageUrl: data.imageUrl ?? null,
          _count: { cards: cards.length },
          course: linkedCourse ? { ...linkedCourse, thumbnailUrl: g.course?.thumbnailUrl ?? null } : null,
        }
      : g
    ));
    closeModal();
  }

  function closeModal() { setModal(null); setTitle(""); setDescription(""); setCourseId(""); setTopicId(""); setImageUrl(""); setGeneratedCards([]); setAiError(null); setFileName(null); setEditingId(null); setEditCards([]); }

  // ── Estrutura: curso › módulo › tema, com os grupos de cada tema ──
  const porTema = new Map<string, Group[]>();
  for (const g of groups) if (g.topicId) porTema.set(g.topicId, [...(porTema.get(g.topicId) ?? []), g]);
  const temasConhecidos = new Set(courses.flatMap((c) => c.modules.flatMap((m) => m.topics.map((t) => t.id))));
  const estrutura = courses
    .map((curso) => ({
      curso,
      modulos: curso.modules
        .map((modulo, indice) => ({
          modulo,
          indice,
          temas: modulo.topics.map((tema, i) => ({ tema, numero: i + 1, grupos: porTema.get(tema.id) ?? [] })),
        }))
        .filter((m) => m.temas.length > 0),
      semTema: groups.filter((g) => g.course?.slug === curso.slug && (!g.topicId || !temasConhecidos.has(g.topicId))),
    }))
    // Curso aparece se já tem algum grupo; os temas vazios dele viram atalho para criar
    .filter((c) => c.semTema.length > 0 || c.modulos.some((m) => m.temas.some((t) => t.grupos.length > 0)));
  const semCurso = groups.filter((g) => !g.course);

  function criarNoTema(curso: string, tema: string, nome: string) {
    setCourseId(curso);
    setTopicId(tema);
    setTitle(nome);
    setModal("manual");
  }

  /** Card compacto de um grupo, na cor do módulo. */
  function cardGrupo(g: Group, cor: ModuleColor, rotulo: string | null, nomeDoTema: string | null) {
    const nomeDiferente = nomeDoTema !== null && g.title.trim() !== nomeDoTema.trim();
    return (
      <div key={g.id} className="flex flex-col rounded-xl overflow-hidden border border-border bg-surface hover:shadow-md transition-shadow">
        <div
          className="relative h-20 overflow-hidden"
          style={{ background: `linear-gradient(140deg, ${cor.accent} 0%, color-mix(in srgb, ${cor.accent} 60%, black) 100%)` }}
        >
          {g.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={g.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity" />
          ) : (
            <div aria-hidden="true" className="absolute -right-6 -bottom-10 w-24 h-24 rounded-full bg-white/10" />
          )}
          <LayersIcon aria-hidden="true" className="absolute right-3 bottom-2.5 w-6 h-6 text-white/25" />
          <div className="absolute inset-x-3 top-2.5 flex items-center justify-between gap-2">
            {rotulo && <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-white/85">{rotulo}</span>}
            <span className="ml-auto font-sans text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white">
              {g._count.cards} card{g._count.cards !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1.5 px-3 py-2.5">
          <h3 className="font-sans text-[13px] font-semibold text-foreground leading-snug line-clamp-2">{g.title}</h3>
          {nomeDiferente && (
            <p className="flex items-start gap-1 font-sans text-[11px] text-amber-800 leading-snug">
              <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
              <span>Nome diferente do tema: {nomeDoTema}. O aluno vê o nome do tema.</span>
            </p>
          )}
          <div className="flex items-center gap-1 border-t border-border/60 pt-2 mt-auto -mx-3 px-3">
            <button
              onClick={() => openEdit(g)}
              className="flex items-center gap-1 font-sans text-[11px] font-semibold px-2 py-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
            >
              <Pencil className="w-3 h-3" /> Editar
            </button>
            <a
              href={`/dashboard/flashcards/${g.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 font-sans text-[11px] font-semibold px-2 py-1 rounded-md text-muted hover:text-foreground hover:bg-background transition-colors"
            >
              <BookOpen className="w-3 h-3" /> Ver
            </a>
            <button
              onClick={() => handleDelete(g.id)}
              className="p-1.5 rounded-md text-muted/60 hover:text-red-500 hover:bg-red-500/10 transition-colors ml-auto"
              title="Excluir grupo"
              aria-label="Excluir grupo"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

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

      {/* Grupos organizados por curso e módulo, na cor de cada módulo (a
          mesma da área do aluno). Antes era uma grade única, com a capa do
          curso repetida em todos os cards. */}
      {groups.length === 0 ? (
        <div className="text-center py-24 text-muted">
          <LayersIcon className="w-10 h-10 mx-auto mb-3 opacity-20" />
          <p className="font-sans text-sm">Nenhum grupo de flashcards ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-12">
          {estrutura.map(({ curso, modulos, semTema }) => (
            <section key={curso.id} className="flex flex-col gap-6">
              <h2 className="font-serif text-2xl font-medium text-foreground">{curso.title}</h2>

              {modulos.map(({ modulo, indice, temas }) => {
                const cor = moduleColor(indice);
                const prontos = temas.filter((t) => t.grupos.length > 0).length;
                return (
                  <div key={modulo.id} className="flex flex-col gap-3">
                    <div
                      className="rounded-xl px-4 py-3 text-white flex flex-wrap items-center gap-x-3 gap-y-1"
                      style={{ background: `linear-gradient(120deg, ${cor.accent} 0%, color-mix(in srgb, ${cor.accent} 70%, black) 100%)` }}
                    >
                      <span className="flex items-center justify-center w-7 h-7 rounded-md bg-white/15 font-sans text-xs font-bold">{indice + 1}</span>
                      <h3 className="flex-1 min-w-[12rem] font-sans text-sm font-semibold">{modulo.title}</h3>
                      <span className="font-sans text-xs text-white/80 tabular-nums">{prontos}/{temas.length} temas com flashcards</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {temas.flatMap(({ tema, numero, grupos }) =>
                        grupos.length > 0
                          ? grupos.map((g) => cardGrupo(g, cor, `Tema ${numero}`, tema.title))
                          : [
                              <button
                                key={tema.id}
                                type="button"
                                onClick={() => criarNoTema(curso.id, tema.id, tema.title)}
                                className="flex flex-col rounded-xl overflow-hidden border border-dashed text-left hover:shadow-md transition-shadow"
                                style={{ borderColor: cor.border }}
                              >
                                <div className="relative h-20 flex items-center justify-center" style={{ background: cor.tint }}>
                                  <span className="absolute left-3 top-2.5 font-sans text-[10px] font-bold uppercase tracking-widest" style={{ color: cor.accent, opacity: 0.6 }}>
                                    Tema {numero}
                                  </span>
                                  <Lock className="w-5 h-5" style={{ color: cor.accent, opacity: 0.4 }} />
                                </div>
                                <div className="px-3 py-2.5 flex flex-col gap-1.5">
                                  <p className="font-sans text-[13px] font-medium text-muted leading-snug line-clamp-2">{tema.title}</p>
                                  <span className="inline-flex items-center gap-1 font-sans text-[11px] font-semibold" style={{ color: cor.accent }}>
                                    <Plus className="w-3 h-3" /> Criar flashcards
                                  </span>
                                </div>
                              </button>,
                            ],
                      )}
                    </div>
                  </div>
                );
              })}

              {semTema.length > 0 && (
                <div className="flex flex-col gap-3">
                  <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">Sem tema definido</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {semTema.map((g) => cardGrupo(g, moduleColor(0), null, null))}
                  </div>
                </div>
              )}
            </section>
          ))}

          {semCurso.length > 0 && (
            <section className="flex flex-col gap-3">
              <h2 className="font-serif text-2xl font-medium text-foreground">Material geral</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {semCurso.map((g) => cardGrupo(g, moduleColor(0), null, null))}
              </div>
            </section>
          )}
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
                <select
                  value={courseId}
                  onChange={(e) => { setCourseId(e.target.value); setTopicId(""); }}
                  className={inputClass}
                >
                  <option value="">— Nenhum curso —</option>
                  {courses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>

              {/* O tópico é o que põe o grupo no lugar certo da listagem do
                  aluno, dentro do módulo e na cor dele. */}
              {courseId && (
                <div>
                  <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Tópico do curso</label>
                  <select value={topicId} onChange={(e) => setTopicId(e.target.value)} className={inputClass}>
                    <option value="">— Sem tópico —</option>
                    {courses.find((c) => c.id === courseId)?.modules.map((m, i) => (
                      <optgroup key={m.id} label={`Módulo ${i + 1} — ${m.title}`}>
                        {m.topics.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                      </optgroup>
                    ))}
                  </select>
                  <p className="font-sans text-[11px] text-muted mt-1">
                    Define onde o grupo aparece para o aluno. Sem tópico, ele fica solto no fim da página do curso.
                  </p>
                </div>
              )}

              <div>
                <label className="block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5">Imagem de capa</label>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-14 rounded-lg overflow-hidden border border-border bg-background shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <LayersIcon className="w-4 h-4 text-muted/40" />
                    )}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-sans text-xs font-medium px-3 py-1.5 border border-dashed border-border rounded-lg hover:bg-background transition-colors w-fit">
                      {enviandoImagem ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {imageUrl ? "Trocar imagem" : "Escolher imagem"}
                      <input
                        ref={imagemRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => { const f = e.target.files?.[0]; if (f) enviarImagem(f); }}
                      />
                    </label>
                    {imageUrl && (
                      <button onClick={() => setImageUrl("")} className="font-sans text-[11px] text-muted hover:text-red-500 transition-colors w-fit">
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
                <p className="font-sans text-[11px] text-muted mt-1.5">Sem imagem, o card usa a cor do módulo.</p>
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
                      <input type="number" min={5} max={100} value={cardCount} onChange={(e) => setCardCount(parseInt(e.target.value))} className="w-16 px-2 py-1 border border-border rounded-lg text-sm text-center bg-background" />
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

              {/* Revisão dos cards já salvos. Antes da edição existir, a única
                  forma de corrigir um card era apagar o grupo inteiro. */}
              {modal === "edit" && (
                <div className="space-y-2 border-t border-border pt-4">
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-xs font-semibold text-muted uppercase tracking-wider">
                      {loadingCards ? "Carregando cards..." : `${editCards.length} card${editCards.length !== 1 ? "s" : ""}`}
                    </p>
                    <button
                      onClick={() => setEditCards((prev) => [...prev, { front: "", back: "" }])}
                      className="flex items-center gap-1 font-sans text-[11px] font-semibold text-primary hover:underline"
                    >
                      <Plus className="w-3 h-3" /> Acrescentar card
                    </button>
                  </div>

                  {loadingCards && <Loader2 className="w-4 h-4 animate-spin text-muted" />}

                  {!loadingCards && editCards.length > 0 && (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {editCards.map((card, i) => (
                        <div key={card.id ?? `novo-${i}`} className="bg-background border border-border rounded-lg p-3 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="font-sans text-[10px] font-bold text-muted shrink-0 mt-1 w-11">{i + 1} FRENTE</span>
                            <textarea
                              value={card.front}
                              onChange={(e) => alterarCard(i, "front", e.target.value)}
                              rows={2}
                              className="flex-1 text-xs border border-border rounded px-2 py-1 bg-surface resize-y focus:outline-none focus:border-primary/50"
                            />
                            <button
                              onClick={() => setEditCards((prev) => prev.filter((_, j) => j !== i))}
                              className="text-muted/40 hover:text-red-500 shrink-0"
                              title="Remover card"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="flex items-start gap-2">
                            <span className="font-sans text-[10px] font-bold text-muted shrink-0 mt-1 w-11">VERSO</span>
                            <textarea
                              value={card.back}
                              onChange={(e) => alterarCard(i, "back", e.target.value)}
                              rows={3}
                              className="flex-1 text-xs border border-border rounded px-2 py-1 bg-surface resize-y focus:outline-none focus:border-primary/50"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="font-sans text-[11px] text-muted">
                    Card removido aqui some para os alunos junto com o histórico de estudo dele. Os demais mantêm o progresso.
                  </p>
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
