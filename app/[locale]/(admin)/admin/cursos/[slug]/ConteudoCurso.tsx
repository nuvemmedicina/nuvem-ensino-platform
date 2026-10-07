import Link from "next/link";
import { ArrowDown, ArrowUp, CheckCircle, ChevronLeft, ChevronRight, FileText, Lock, Plus, Radio, Video } from "lucide-react";
import {
  createLessonUnderTopic,
  createModule,
  createTopic,
  deleteLesson,
  deleteModule,
  deleteTopic,
  moveLesson,
  moveModule,
  moveTopic,
  removeLessonVideo,
  updateLesson,
  updateModule,
  updateModuleReleaseDate,
  updateTopic,
  updateTopicApostila,
} from "./actions";
import { addOption, addQuestion, createQuiz, deleteQuestion, deleteQuiz } from "./quizActions";
import { ModuleInstructorSelector } from "./ModuleInstructorSelector";
import { LessonInstructorSelector } from "./LessonInstructorSelector";
import { DeleteButton } from "./DeleteButton";
import { MuxUploader } from "./MuxUploader";
import { RemoveVideoButton } from "./RemoveVideoButton";
import { ApostilaUploader } from "./ApostilaUploader";

/**
 * Aba Conteúdo da edição do curso: árvore à esquerda (só títulos) e o editor
 * de UM item à direita — módulo, tema ou aula, escolhido pela URL (?item=).
 * Antes, todas as aulas e questões eram montadas de uma vez.
 */

type Aula = {
  id: string;
  title: string;
  description: string | null;
  duration: number | null;
  type: string;
  videoUrl: string | null;
  audioUrl: string | null;
  muxAssetId: string | null;
  muxPlaybackId: string | null;
  isFree: boolean;
  instructors: { instructorId: string }[];
  quiz: {
    id: string;
    title: string;
    questions: { id: string; order: number; text: string; options: { id: string; text: string; isCorrect: boolean }[] }[];
  } | null;
};
type Tema = { id: string; title: string; apostilaUrl: string | null; lessons: Aula[] };
type Modulo = { id: string; title: string; releaseDate: Date | null; instructors: { instructorId: string }[]; topics: Tema[] };

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass = "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";
const btnPrimary = "font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors";
const btnGhost =
  "font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors";
const btnDanger = "font-sans text-xs px-2 py-1.5 rounded-lg text-red-700/70 hover:text-red-700 hover:bg-red-50 transition-colors";
const btnSeta =
  "inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border text-muted hover:text-foreground hover:border-primary/40 disabled:opacity-30 disabled:pointer-events-none";

function semVideo(a: Aula) {
  return !a.muxPlaybackId && !a.muxAssetId && !a.videoUrl;
}

export function ConteudoCurso({
  courseId,
  slug,
  modules,
  item,
  allInstructors,
}: {
  courseId: string;
  slug: string;
  modules: Modulo[];
  item: string | undefined;
  allInstructors: { id: string; name: string | null; title: string | null }[];
}) {
  const base = `/admin/cursos/${slug}?aba=conteudo`;
  const link = (tipo: "modulo" | "tema" | "aula", id: string) => `${base}&item=${tipo}:${id}`;
  const agora = new Date();

  // ── Item selecionado (padrão: primeiro módulo) ──
  const [tipoSel, idSel] = (item ?? "").split(":");
  const todasAulas = modules.flatMap((m) => m.topics.flatMap((t) => t.lessons.map((a) => ({ a, t, m }))));
  const aulaSel = tipoSel === "aula" ? todasAulas.find((x) => x.a.id === idSel) : undefined;
  const temaSel =
    tipoSel === "tema" ? modules.flatMap((m) => m.topics.map((t) => ({ t, m }))).find((x) => x.t.id === idSel) : undefined;
  const moduloSel = aulaSel || temaSel ? undefined : modules.find((m) => m.id === idSel) ?? modules[0];

  const setas = (acaoCima: () => Promise<void>, acaoBaixo: () => Promise<void>, primeiro: boolean, ultimo: boolean, nome: string) => (
    <div className="flex items-center gap-1.5">
      <form action={acaoCima}>
        <button type="submit" className={btnSeta} disabled={primeiro} aria-label={`Mover ${nome} para cima`} title="Mover para cima">
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
      <form action={acaoBaixo}>
        <button type="submit" className={btnSeta} disabled={ultimo} aria-label={`Mover ${nome} para baixo`} title="Mover para baixo">
          <ArrowDown className="w-4 h-4" aria-hidden="true" />
        </button>
      </form>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] items-start">
      {/* ── Árvore ── */}
      <nav aria-label="Módulos, temas e aulas" className="bg-surface border border-border rounded-2xl p-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <ol className="flex flex-col gap-1">
          {modules.map((m, mi) => {
            const bloqueado = !!m.releaseDate && m.releaseDate > agora;
            const ativoM = moduloSel?.id === m.id;
            return (
              <li key={m.id}>
                <Link
                  href={link("modulo", m.id)}
                  scroll={false}
                  aria-current={ativoM ? "page" : undefined}
                  className={`flex items-start gap-2 px-2 py-2 rounded-lg font-sans text-sm font-semibold ${ativoM ? "bg-primary/10 text-primary" : "text-foreground hover:bg-background"}`}
                >
                  <span className="w-5 shrink-0 text-muted tabular-nums">{mi + 1}.</span>
                  <span className="flex-1 min-w-0">{m.title.split("—")[0].trim()}</span>
                  {bloqueado && <Lock className="w-3.5 h-3.5 mt-0.5 text-amber-700 shrink-0" aria-label="Ainda não liberado" />}
                </Link>
                <ol className="ml-5 border-l border-border pl-2 flex flex-col">
                  {m.topics.map((t) => {
                    const ativoT = temaSel?.t.id === t.id;
                    return (
                      <li key={t.id}>
                        <Link
                          href={link("tema", t.id)}
                          scroll={false}
                          aria-current={ativoT ? "page" : undefined}
                          className={`block px-2 py-1.5 rounded-lg font-sans text-xs font-semibold uppercase tracking-wide ${ativoT ? "bg-primary/10 text-primary" : "text-muted hover:bg-background"}`}
                        >
                          {t.title}
                        </Link>
                        <ol className="flex flex-col">
                          {t.lessons.map((a) => {
                            const ativoA = aulaSel?.a.id === a.id;
                            return (
                              <li key={a.id}>
                                <Link
                                  href={link("aula", a.id)}
                                  scroll={false}
                                  aria-current={ativoA ? "page" : undefined}
                                  className={`flex items-start gap-1.5 px-2 py-1.5 rounded-lg font-sans text-[13px] ${ativoA ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-background"}`}
                                >
                                  <span className="flex-1 min-w-0 leading-snug">{a.title.trim()}</span>
                                  {semVideo(a) ? (
                                    <span className="shrink-0 text-[11px] text-amber-800 bg-amber-100 rounded px-1">sem vídeo</span>
                                  ) : a.duration ? (
                                    <span className="shrink-0 text-[11px] text-muted tabular-nums">{a.duration}′</span>
                                  ) : null}
                                </Link>
                              </li>
                            );
                          })}
                        </ol>
                      </li>
                    );
                  })}
                </ol>
              </li>
            );
          })}
        </ol>
        <form action={createModule.bind(null, courseId, slug)} className="flex gap-2 mt-3 pt-3 border-t border-border">
          <label htmlFor="novo-modulo" className="sr-only">Título do novo módulo</label>
          <input id="novo-modulo" name="title" placeholder="Novo módulo" required className={`${inputClass} flex-1 text-xs`} />
          <button type="submit" className={btnGhost} aria-label="Criar módulo">
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </form>
      </nav>

      {/* ── Editor do item escolhido ── */}
      <div className="flex flex-col gap-5 min-w-0">
        {moduloSel && (() => {
          const m = moduloSel;
          const i = modules.findIndex((x) => x.id === m.id);
          const bloqueado = !!m.releaseDate && m.releaseDate > agora;
          return (
            <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Módulo {i + 1}</p>
                <div className="flex items-center gap-2">
                  {setas(moveModule.bind(null, m.id, slug, "cima"), moveModule.bind(null, m.id, slug, "baixo"), i === 0, i === modules.length - 1, "o módulo")}
                  <DeleteButton
                    action={deleteModule.bind(null, m.id, slug)}
                    confirm={`Excluir o módulo "${m.title}" e todos os seus temas e aulas?`}
                    rotulo="Excluir módulo"
                    className={btnDanger}
                  />
                </div>
              </div>

              <form action={updateModule.bind(null, m.id, slug)} className="flex flex-col gap-2">
                <label htmlFor="modulo-titulo" className={labelClass}>Título</label>
                <div className="flex gap-2">
                  <input id="modulo-titulo" name="title" defaultValue={m.title} required className={`${inputClass} font-semibold`} />
                  <button type="submit" className={btnPrimary}>Salvar</button>
                </div>
              </form>

              <form action={updateModuleReleaseDate.bind(null, m.id, slug)} className="flex flex-col gap-2">
                <label htmlFor="modulo-liberacao" className={labelClass}>Liberar em</label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    id="modulo-liberacao"
                    name="releaseDate"
                    type="datetime-local"
                    defaultValue={m.releaseDate ? new Date(m.releaseDate).toISOString().slice(0, 16) : ""}
                    className={`${inputClass} max-w-xs`}
                  />
                  <button type="submit" className={btnGhost}>Salvar</button>
                  {bloqueado && <span className="font-sans text-xs text-amber-800">Ainda não liberado para os alunos</span>}
                </div>
              </form>

              <div className="flex flex-col gap-2">
                <span className={labelClass}>Docentes do módulo</span>
                <ModuleInstructorSelector moduleId={m.id} courseSlug={slug} allInstructors={allInstructors} initialIds={m.instructors.map((x) => x.instructorId)} />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <span className={labelClass}>Temas ({m.topics.length})</span>
                <ul className="flex flex-col gap-1">
                  {m.topics.map((t) => (
                    <li key={t.id}>
                      <Link href={link("tema", t.id)} scroll={false} className="font-sans text-sm text-primary hover:underline">
                        {t.title} · {t.lessons.length} {t.lessons.length === 1 ? "aula" : "aulas"}
                      </Link>
                    </li>
                  ))}
                </ul>
                <form action={createTopic.bind(null, m.id, slug)} className="flex gap-2 mt-1">
                  <label htmlFor="novo-tema" className="sr-only">Título do novo tema</label>
                  <input id="novo-tema" name="title" placeholder="Título do novo tema" required className={`${inputClass} flex-1`} />
                  <button type="submit" className={btnGhost}>
                    <Plus className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                    Tema
                  </button>
                </form>
              </div>
            </section>
          );
        })()}

        {temaSel && (() => {
          const { t, m } = temaSel;
          const i = m.topics.findIndex((x) => x.id === t.id);
          return (
            <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between gap-3">
                <Link href={link("modulo", m.id)} scroll={false} className="inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  {m.title.split("—")[0].trim()} · Tema
                </Link>
                <div className="flex items-center gap-2">
                  {setas(moveTopic.bind(null, t.id, slug, "cima"), moveTopic.bind(null, t.id, slug, "baixo"), i === 0, i === m.topics.length - 1, "o tema")}
                  <DeleteButton
                    action={deleteTopic.bind(null, t.id, slug)}
                    confirm={`Excluir o tema "${t.title}" e todas as suas aulas?`}
                    rotulo="Excluir tema"
                    className={btnDanger}
                  />
                </div>
              </div>

              <form action={updateTopic.bind(null, t.id, slug)} className="flex flex-col gap-2">
                <label htmlFor="tema-titulo" className={labelClass}>Título</label>
                <div className="flex gap-2">
                  <input id="tema-titulo" name="title" defaultValue={t.title} required className={`${inputClass} font-semibold`} />
                  <button type="submit" className={btnPrimary}>Salvar</button>
                </div>
              </form>

              <div className="flex flex-col gap-2">
                <span className={labelClass}>Apostila do tema</span>
                <ApostilaUploader moduleId={t.id} courseSlug={slug} currentUrl={t.apostilaUrl ?? null} updateAction={updateTopicApostila} />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <span className={labelClass}>Aulas ({t.lessons.length})</span>
                <ul className="flex flex-col gap-1">
                  {t.lessons.map((a) => (
                    <li key={a.id}>
                      <Link href={link("aula", a.id)} scroll={false} className="font-sans text-sm text-primary hover:underline">
                        {a.title.trim()}
                      </Link>
                    </li>
                  ))}
                </ul>
                <form action={createLessonUnderTopic.bind(null, t.id, m.id, slug)} className="flex flex-wrap gap-2 mt-1">
                  <label htmlFor="nova-aula" className="sr-only">Título da nova aula</label>
                  <input id="nova-aula" name="title" placeholder="Título da nova aula" required className={`${inputClass} flex-1 min-w-[12rem]`} />
                  <button type="submit" className={btnGhost}>
                    <Plus className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                    Aula
                  </button>
                </form>
              </div>
            </section>
          );
        })()}

        {aulaSel && (() => {
          const { a, t, m } = aulaSel;
          const i = t.lessons.findIndex((x) => x.id === a.id);
          const pos = todasAulas.findIndex((x) => x.a.id === a.id);
          const anterior = todasAulas[pos - 1]?.a;
          const proxima = todasAulas[pos + 1]?.a;
          const comVideoMux = !!a.muxAssetId;
          return (
            <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Link href={link("tema", t.id)} scroll={false} className="inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  {m.title.split("—")[0].trim()} · {t.title}
                </Link>
                <div className="flex items-center gap-2">
                  {setas(moveLesson.bind(null, a.id, slug, "cima"), moveLesson.bind(null, a.id, slug, "baixo"), i === 0, i === t.lessons.length - 1, "a aula")}
                  <DeleteButton action={deleteLesson.bind(null, a.id, slug)} confirm={`Excluir a aula "${a.title}"?`} rotulo="Excluir aula" className={btnDanger} />
                </div>
              </div>

              <form action={updateLesson.bind(null, a.id, slug)} className="flex flex-col gap-4">
                <div>
                  <label htmlFor="aula-titulo" className={labelClass}>Título</label>
                  <input id="aula-titulo" name="title" defaultValue={a.title} required className={`${inputClass} font-semibold`} />
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label htmlFor="aula-tipo" className={labelClass}>Tipo</label>
                    <select id="aula-tipo" name="type" defaultValue={a.type === "QUIZ" ? "VIDEO" : a.type} className={inputClass}>
                      <option value="VIDEO">Videoaula</option>
                      <option value="LIVE">Aula ao vivo</option>
                      <option value="TEXT">Leitura</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="aula-duracao" className={labelClass}>Duração</label>
                    {comVideoMux ? (
                      <p id="aula-duracao" className="font-sans text-sm text-foreground py-2">
                        {a.duration ? `${a.duration} min` : "—"} <span className="text-muted">· vem do vídeo</span>
                      </p>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input id="aula-duracao" name="duration" type="number" min="0" step="1" defaultValue={a.duration ?? ""} className={inputClass} />
                        <span className="font-sans text-xs text-muted shrink-0">min</span>
                      </div>
                    )}
                  </div>
                  <label className="flex items-center gap-2 font-sans text-sm text-foreground cursor-pointer sm:mt-6">
                    <input type="checkbox" name="isFree" defaultChecked={a.isFree} className="accent-primary w-4 h-4" />
                    Aula gratuita
                  </label>
                </div>

                <div>
                  <label htmlFor="aula-youtube" className={labelClass}>Vídeo do YouTube (opcional, se não houver vídeo no Mux)</label>
                  <input id="aula-youtube" name="videoUrl" defaultValue={a.videoUrl ?? ""} placeholder="https://youtube.com/…" className={inputClass} />
                </div>
                <div>
                  <label htmlFor="aula-audio" className={labelClass}>Áudio da aula (URL do MP3, opcional)</label>
                  <input id="aula-audio" name="audioUrl" defaultValue={a.audioUrl ?? ""} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="aula-descricao" className={labelClass}>Resumo da aula (aparece na aba Resumo)</label>
                  <textarea id="aula-descricao" name="description" defaultValue={a.description ?? ""} rows={6} className={`${inputClass} resize-y`} />
                </div>
                <div>
                  <button type="submit" className={btnPrimary}>Salvar aula</button>
                </div>
              </form>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <span className={labelClass}>Docentes da aula</span>
                <LessonInstructorSelector lessonId={a.id} courseSlug={slug} allInstructors={allInstructors} initialIds={a.instructors.map((x) => x.instructorId)} />
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <span className={labelClass}>Vídeo no Mux</span>
                {a.muxPlaybackId ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 shrink-0 text-green-700" aria-hidden="true" />
                    <span className="font-sans text-sm font-semibold text-green-800">Vídeo ativo</span>
                    <span className="font-sans text-xs text-muted font-mono">{a.muxPlaybackId.slice(0, 12)}…</span>
                    <RemoveVideoButton action={removeLessonVideo.bind(null, a.id, slug)} />
                  </div>
                ) : a.muxAssetId ? (
                  <p className="font-sans text-sm text-amber-800">Processando no Mux… a página atualiza quando o vídeo ficar pronto.</p>
                ) : (
                  <MuxUploader lessonId={a.id} />
                )}
              </div>

              <div className="flex flex-col gap-2 pt-4 border-t border-border">
                <span className={labelClass}>Quiz da aula (opcional)</span>
                {!a.quiz ? (
                  <form action={createQuiz.bind(null, a.id, slug)} className="flex gap-2">
                    <input name="title" placeholder="Título do quiz" required aria-label="Título do quiz" className={`${inputClass} flex-1`} />
                    <button type="submit" className={btnGhost}>
                      <Plus className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                      Criar quiz
                    </button>
                  </form>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="font-sans text-sm font-semibold text-foreground">{a.quiz.title}</span>
                      <DeleteButton action={deleteQuiz.bind(null, a.quiz.id, slug)} confirm={`Excluir o quiz "${a.quiz.title}" e todas as perguntas?`} rotulo="Excluir quiz" className={btnDanger} />
                    </div>
                    {a.quiz.questions.map((q) => (
                      <div key={q.id} className="border border-border rounded-lg p-3 flex flex-col gap-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-sans text-sm text-foreground leading-snug flex-1">
                            {q.order}. {q.text}
                          </span>
                          <DeleteButton action={deleteQuestion.bind(null, q.id, slug)} confirm={`Excluir a pergunta "${q.text}"?`} rotulo="Excluir pergunta" className={btnDanger} />
                        </div>
                        <ul className="pl-3 flex flex-col gap-1">
                          {q.options.map((o) => (
                            <li key={o.id} className={`font-sans text-xs ${o.isCorrect ? "text-green-800 font-semibold" : "text-muted"}`}>
                              {o.isCorrect ? "✓" : "○"} {o.text}
                            </li>
                          ))}
                        </ul>
                        <form action={addOption.bind(null, q.id, slug)} className="flex gap-2">
                          <input name="text" placeholder="Texto da opção" required aria-label="Texto da opção" className={`${inputClass} flex-1 text-xs`} />
                          <label className="flex items-center gap-1.5 font-sans text-xs text-muted cursor-pointer shrink-0">
                            <input type="checkbox" name="isCorrect" className="accent-primary" />
                            Correta
                          </label>
                          <button type="submit" className={btnGhost}>+ Opção</button>
                        </form>
                      </div>
                    ))}
                    <form action={addQuestion.bind(null, a.quiz.id, slug)} className="flex gap-2">
                      <input name="text" placeholder="Texto da pergunta" required aria-label="Texto da pergunta" className={`${inputClass} flex-1`} />
                      <button type="submit" className={btnGhost}>
                        <Plus className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                        Pergunta
                      </button>
                    </form>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                {anterior ? (
                  <Link href={link("aula", anterior.id)} scroll={false} className="inline-flex items-center gap-1 font-sans text-sm text-primary hover:underline">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    Aula anterior
                  </Link>
                ) : (
                  <span />
                )}
                {proxima && (
                  <Link href={link("aula", proxima.id)} scroll={false} className="inline-flex items-center gap-1 font-sans text-sm text-primary hover:underline">
                    Próxima aula
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </section>
          );
        })()}

        {modules.length === 0 && (
          <p className="font-sans text-sm text-muted">Este curso ainda não tem módulos. Crie o primeiro na coluna à esquerda.</p>
        )}

        <p className="font-sans text-xs text-muted flex flex-wrap gap-x-4 gap-y-1">
          <span className="inline-flex items-center gap-1"><Video className="w-3.5 h-3.5" aria-hidden="true" /> número ao lado da aula = duração em minutos</span>
          <span className="inline-flex items-center gap-1"><Radio className="w-3.5 h-3.5" aria-hidden="true" /> “sem vídeo” = falta subir o vídeo</span>
          <span className="inline-flex items-center gap-1"><FileText className="w-3.5 h-3.5" aria-hidden="true" /> a apostila fica no tema</span>
        </p>
      </div>
    </div>
  );
}
