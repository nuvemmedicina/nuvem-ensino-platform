import Link from "next/link";
import { AlertTriangle, ChevronLeft, ChevronRight, Plus, Search } from "lucide-react";
import {
  createModuleQuiz,
  criarQuestao,
  deleteModuleQuiz,
  deleteModuleQuizOption,
  deleteModuleQuizQuestion,
  salvarQuestao,
  updateModuleQuiz,
} from "./moduleQuizActions";
import { DeleteButton } from "./DeleteButton";

/**
 * Aba Provas da edição do curso: as provas dos módulos e, à esquerda, as
 * questões da prova escolhida, com busca; à direita, UMA questão por vez com
 * enunciado, alternativas, gabarito, tema e justificativa editáveis.
 * Antes só a justificativa era editável, e as 119 questões do DICI vinham
 * todas abertas na mesma página.
 */

type Opcao = { id: string; text: string; isCorrect: boolean; order: number };
type Questao = { id: string; text: string; order: number; topic: string | null; explanation: string | null; sourceRef: string | null; options: Opcao[] };
type Prova = {
  id: string;
  title: string;
  availableFrom: Date | null;
  availableUntil: Date | null;
  passingPct: number;
  maxAttempts: number;
  questionsPerAttempt: number | null;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  avoidRepeats: boolean;
  showExplanations: boolean;
  practiceEnabled: boolean;
  questions: Questao[];
};
type Modulo = { id: string; title: string; quiz: Prova | null };

const inputClass =
  "w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted/50 focus:outline-none focus:border-primary/50";
const labelClass = "block font-sans text-xs font-semibold text-muted uppercase tracking-wider mb-1.5";
const btnPrimary = "font-sans text-sm font-semibold px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors";
const btnGhost =
  "font-sans text-xs font-semibold px-3 py-1.5 rounded-lg border border-border text-muted hover:border-primary/40 hover:text-foreground transition-colors";
const btnDanger = "font-sans text-xs px-2 py-1.5 rounded-lg text-red-500/60 hover:text-red-500 hover:bg-red-500/10 transition-colors";

const LETRAS = "ABCDEFGHIJ";

/** Sem acento e em minúsculas, para a busca achar "funcao" em "função". */
function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function pendencias(q: Questao) {
  const p: string[] = [];
  if (!q.options.some((o) => o.isCorrect)) p.push("sem gabarito");
  if (q.options.length < 2) p.push("poucas alternativas");
  if (!q.topic) p.push("sem tema");
  if (!q.explanation) p.push("sem justificativa");
  return p;
}

export function ProvasCurso({
  slug,
  modules,
  moduloId,
  questaoId,
  busca,
  vezesSorteada,
}: {
  slug: string;
  modules: Modulo[];
  moduloId: string | undefined;
  questaoId: string | undefined;
  busca: string | undefined;
  /** Em quantas tentativas a questão escolhida já foi sorteada. */
  vezesSorteada: number;
}) {
  const modulo =
    modules.find((m) => m.id === moduloId) ??
    modules.find((m) => m.quiz?.questions.some((q) => q.id === questaoId)) ??
    modules.find((m) => m.quiz) ??
    modules[0];
  const prova = modulo?.quiz ?? null;
  const base = `/admin/cursos/${slug}?aba=provas&modulo=${modulo?.id ?? ""}`;
  const linkQuestao = (id: string) => `${base}&questao=${id}${busca ? `&q=${encodeURIComponent(busca)}` : ""}`;

  const termo = busca?.trim() ? normalizar(busca.trim()) : null;
  const visiveis =
    prova?.questions.filter(
      (q) =>
        !termo ||
        normalizar(q.text).includes(termo) ||
        normalizar(q.topic ?? "").includes(termo) ||
        q.options.some((o) => normalizar(o.text).includes(termo)),
    ) ?? [];
  const questao = prova?.questions.find((q) => q.id === questaoId) ?? null;
  const posicao = questao ? prova!.questions.findIndex((q) => q.id === questao.id) : -1;
  const temas = Array.from(new Set((prova?.questions ?? []).map((q) => q.topic).filter((t): t is string => !!t))).sort();
  const comPendencia = prova?.questions.filter((q) => pendencias(q).length > 0).length ?? 0;

  return (
    <div className="flex flex-col gap-5">
      {/* ── Escolha da prova ── */}
      <nav aria-label="Provas dos módulos" className="flex flex-wrap gap-2">
        {modules.map((m) => (
          <Link
            key={m.id}
            href={`/admin/cursos/${slug}?aba=provas&modulo=${m.id}`}
            scroll={false}
            aria-current={m.id === modulo?.id ? "page" : undefined}
            className={`font-sans text-sm px-3.5 py-2 rounded-full border ${
              m.id === modulo?.id ? "border-primary bg-primary text-white font-semibold" : "border-border text-foreground hover:border-primary/40"
            }`}
          >
            {m.title.split("—")[0].trim()}
            <span className={m.id === modulo?.id ? "text-white/70" : "text-muted"}> · {m.quiz ? `${m.quiz.questions.length} questões` : "sem prova"}</span>
          </Link>
        ))}
      </nav>

      {!modulo ? (
        <p className="font-sans text-sm text-muted">Crie um módulo na aba Conteúdo para cadastrar a prova dele.</p>
      ) : !prova ? (
        <section className="bg-surface border border-border rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4">
          <p className="font-sans text-sm text-foreground">O {modulo.title.split("—")[0].trim()} ainda não tem prova.</p>
          <form action={createModuleQuiz.bind(null, modulo.id, slug)}>
            <button type="submit" className={btnPrimary}>
              <Plus className="w-4 h-4 inline mr-1" aria-hidden="true" />
              Criar prova
            </button>
          </form>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] items-start">
          {/* ── Questões ── */}
          <div className="bg-surface border border-border rounded-2xl p-3 flex flex-col gap-3 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
            <Link
              href={base}
              scroll={false}
              aria-current={!questao ? "page" : undefined}
              className={`px-2 py-2 rounded-lg font-sans text-sm font-semibold ${!questao ? "bg-primary/10 text-primary" : "text-foreground hover:bg-background"}`}
            >
              Configuração da prova
            </Link>

            <form method="get" action={`/admin/cursos/${slug}`} className="flex gap-2" role="search">
              <input type="hidden" name="aba" value="provas" />
              <input type="hidden" name="modulo" value={modulo.id} />
              <label htmlFor="busca-questoes" className="sr-only">Buscar nas questões</label>
              <input id="busca-questoes" name="q" defaultValue={busca ?? ""} placeholder="Buscar no enunciado, tema ou alternativas" className={`${inputClass} text-xs`} />
              <button type="submit" className={btnGhost} aria-label="Buscar">
                <Search className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            </form>
            {termo && (
              <p className="px-1 font-sans text-xs text-muted">
                {visiveis.length} de {prova.questions.length} questões ·{" "}
                <Link href={base} scroll={false} className="text-primary hover:underline">limpar busca</Link>
              </p>
            )}

            <ol className="flex flex-col">
              {visiveis.map((q) => {
                const n = prova.questions.findIndex((x) => x.id === q.id) + 1;
                const ativo = q.id === questao?.id;
                const p = pendencias(q);
                return (
                  <li key={q.id}>
                    <Link
                      href={linkQuestao(q.id)}
                      scroll={false}
                      aria-current={ativo ? "page" : undefined}
                      className={`flex gap-2 px-2 py-2 rounded-lg font-sans text-[13px] leading-snug ${ativo ? "bg-primary/10 text-primary" : "text-foreground hover:bg-background"}`}
                    >
                      <span className="w-6 shrink-0 text-muted tabular-nums">{n}.</span>
                      <span className="flex-1 min-w-0">
                        <span className="line-clamp-2">{q.text}</span>
                        {p.length > 0 && <span className="block text-[11px] text-amber-800 mt-0.5">{p.join(" · ")}</span>}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>

            <form action={criarQuestao.bind(null, prova.id, modulo.id, slug)} className="flex flex-col gap-2 pt-3 border-t border-border">
              <label htmlFor="nova-questao" className={labelClass}>Nova questão</label>
              <textarea id="nova-questao" name="text" rows={2} placeholder="Enunciado" required className={`${inputClass} text-xs resize-y`} />
              <button type="submit" className={`${btnGhost} self-start`}>
                <Plus className="w-3.5 h-3.5 inline mr-1" aria-hidden="true" />
                Criar e editar
              </button>
            </form>
          </div>

          {/* ── Editor ── */}
          <div className="flex flex-col gap-5 min-w-0">
            {!questao ? (
              <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Configuração da prova · {modulo.title.split("—")[0].trim()}</p>
                  <DeleteButton
                    action={deleteModuleQuiz.bind(null, prova.id, slug)}
                    confirm={`Excluir a prova do ${modulo.title.split("—")[0].trim()} com as ${prova.questions.length} questões? As tentativas dos alunos também serão apagadas.`}
                    rotulo="Excluir prova"
                    className={btnDanger}
                  />
                </div>

                <p className="font-sans text-sm text-foreground">
                  {prova.questions.length} questões ·{" "}
                  {prova.questionsPerAttempt && prova.questionsPerAttempt < prova.questions.length
                    ? `${prova.questionsPerAttempt} sorteadas por aluno`
                    : "todas entregues a cada aluno"}{" "}
                  · mínimo {prova.passingPct}% · até {prova.maxAttempts} tentativas
                  {comPendencia > 0 && (
                    <span className="block mt-1 text-amber-800">
                      <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5" aria-hidden="true" />
                      {comPendencia} {comPendencia === 1 ? "questão tem pendência" : "questões têm pendências"} (marcadas na lista).
                    </span>
                  )}
                </p>

                <form action={updateModuleQuiz.bind(null, prova.id, slug)} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-3">
                    <label htmlFor="prova-titulo" className={labelClass}>Título da prova</label>
                    <input id="prova-titulo" name="title" defaultValue={prova.title} required className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="prova-de" className={labelClass}>Disponível a partir de</label>
                    <input id="prova-de" name="availableFrom" type="datetime-local" defaultValue={prova.availableFrom ? new Date(prova.availableFrom).toISOString().slice(0, 16) : ""} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="prova-ate" className={labelClass}>Prazo final</label>
                    <input id="prova-ate" name="availableUntil" type="datetime-local" defaultValue={prova.availableUntil ? new Date(prova.availableUntil).toISOString().slice(0, 16) : ""} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="prova-sorteio" className={labelClass}>Questões por tentativa</label>
                    <input id="prova-sorteio" name="questionsPerAttempt" type="number" min="1" placeholder={`vazio = todas (${prova.questions.length})`} defaultValue={prova.questionsPerAttempt ?? ""} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="prova-nota" className={labelClass}>Nota mínima (%)</label>
                    <input id="prova-nota" name="passingPct" type="number" min="1" max="100" defaultValue={prova.passingPct} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="prova-tentativas" className={labelClass}>Tentativas permitidas</label>
                    <input id="prova-tentativas" name="maxAttempts" type="number" min="1" defaultValue={prova.maxAttempts} className={inputClass} />
                  </div>
                  <fieldset className="sm:col-span-3 flex flex-wrap gap-x-6 gap-y-2.5">
                    <legend className={labelClass}>Opções</legend>
                    {(
                      [
                        ["shuffleQuestions", "Embaralhar questões", prova.shuffleQuestions],
                        ["shuffleOptions", "Embaralhar alternativas", prova.shuffleOptions],
                        ["avoidRepeats", "Não repetir questões nas novas tentativas", prova.avoidRepeats],
                        ["showExplanations", "Mostrar justificativa das erradas", prova.showExplanations],
                        ["practiceEnabled", "Liberar modo treino (expõe os gabaritos)", prova.practiceEnabled],
                      ] as const
                    ).map(([nome, rotulo, marcado]) => (
                      <label key={nome} className="flex items-center gap-2 font-sans text-sm text-foreground cursor-pointer">
                        <input type="checkbox" name={nome} defaultChecked={marcado} className="accent-primary w-4 h-4" />
                        {rotulo}
                      </label>
                    ))}
                  </fieldset>
                  <div className="sm:col-span-3">
                    <button type="submit" className={btnPrimary}>Salvar configuração</button>
                  </div>
                </form>
              </section>
            ) : (
              <section className="bg-surface border border-border rounded-2xl p-6 flex flex-col gap-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Link href={base} scroll={false} className="inline-flex items-center gap-1 font-sans text-xs font-bold uppercase tracking-widest text-muted hover:text-foreground">
                    <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                    {modulo.title.split("—")[0].trim()} · Questão {posicao + 1} de {prova.questions.length}
                  </Link>
                  <DeleteButton
                    action={deleteModuleQuizQuestion.bind(null, questao.id, slug)}
                    confirm={
                      vezesSorteada > 0
                        ? `Esta questão já foi sorteada em ${vezesSorteada} tentativa(s). Excluir pode afetar a revisão dessas tentativas. Excluir mesmo assim?`
                        : "Excluir esta questão?"
                    }
                    rotulo="Excluir questão"
                    className={btnDanger}
                  />
                </div>

                {vezesSorteada > 0 && (
                  <p className="font-sans text-sm text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    Já sorteada em {vezesSorteada} {vezesSorteada === 1 ? "tentativa" : "tentativas"}. Corrigir o texto é seguro; mudar o gabarito
                    não recalcula as notas já registradas.
                  </p>
                )}

                <form action={salvarQuestao.bind(null, questao.id, slug)} className="flex flex-col gap-5">
                  <div>
                    <label htmlFor="questao-texto" className={labelClass}>Enunciado</label>
                    <textarea id="questao-texto" name="text" defaultValue={questao.text} required rows={5} className={`${inputClass} resize-y`} />
                  </div>

                  <fieldset className="flex flex-col gap-2.5">
                    <legend className={labelClass}>Alternativas · marque a correta</legend>
                    {questao.options.map((o, i) => (
                      <div key={o.id} className={`flex items-start gap-3 rounded-lg border p-2.5 ${o.isCorrect ? "border-green-600/50 bg-green-50" : "border-border"}`}>
                        <label className="flex items-center gap-2 pt-2 shrink-0 cursor-pointer font-sans text-sm font-semibold text-foreground">
                          <input type="radio" name="correta" value={o.id} defaultChecked={o.isCorrect} className="accent-green-700 w-4 h-4" />
                          <span aria-hidden="true">{LETRAS[i]}</span>
                          <span className="sr-only">Marcar a alternativa {LETRAS[i]} como correta</span>
                        </label>
                        <label htmlFor={`opcao-${o.id}`} className="sr-only">Texto da alternativa {LETRAS[i]}</label>
                        <textarea id={`opcao-${o.id}`} name={`opcao:${o.id}`} defaultValue={o.text} rows={2} className={`${inputClass} resize-y flex-1`} />
                        <DeleteButton
                          action={deleteModuleQuizOption.bind(null, o.id, slug)}
                          confirm={
                            vezesSorteada > 0
                              ? `A alternativa ${LETRAS[i]} pode ter sido escolhida em tentativas já feitas. Excluir mesmo assim?`
                              : `Excluir a alternativa ${LETRAS[i]}?`
                          }
                          rotulo={`Excluir a alternativa ${LETRAS[i]}`}
                          className={`${btnDanger} mt-1`}
                        />
                      </div>
                    ))}
                    <div className="flex items-start gap-3 rounded-lg border border-dashed border-border p-2.5">
                      <label className="flex items-center gap-2 pt-2 shrink-0 cursor-pointer font-sans text-sm text-muted">
                        <input type="radio" name="correta" value="nova" className="accent-green-700 w-4 h-4" />
                        <span className="sr-only">Marcar a nova alternativa como correta</span>
                        Nova
                      </label>
                      <label htmlFor="opcao-nova" className="sr-only">Texto da nova alternativa</label>
                      <textarea id="opcao-nova" name="novaOpcao" rows={2} placeholder="Escreva aqui para acrescentar uma alternativa" className={`${inputClass} resize-y flex-1`} />
                    </div>
                  </fieldset>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label htmlFor="questao-tema" className={labelClass}>Tema (usado no domínio por tema)</label>
                      <input id="questao-tema" name="topic" list="temas-da-prova" defaultValue={questao.topic ?? ""} className={inputClass} />
                      <datalist id="temas-da-prova">
                        {temas.map((t) => (
                          <option key={t} value={t} />
                        ))}
                      </datalist>
                    </div>
                    {questao.sourceRef && (
                      <div>
                        <span className={labelClass}>Origem</span>
                        <p className="font-sans text-sm text-muted py-2">{questao.sourceRef}</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <label htmlFor="questao-justificativa" className={labelClass}>Justificativa do gabarito (mostrada a quem errar)</label>
                    <textarea id="questao-justificativa" name="explanation" defaultValue={questao.explanation ?? ""} rows={4} className={`${inputClass} resize-y`} />
                  </div>

                  <div>
                    <button type="submit" className={btnPrimary}>Salvar questão</button>
                  </div>
                </form>

                <div className="flex items-center justify-between gap-3 pt-4 border-t border-border">
                  {posicao > 0 ? (
                    <Link href={linkQuestao(prova.questions[posicao - 1].id)} scroll={false} className="inline-flex items-center gap-1 font-sans text-sm text-primary hover:underline">
                      <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                      Questão anterior
                    </Link>
                  ) : (
                    <span />
                  )}
                  {posicao < prova.questions.length - 1 && (
                    <Link href={linkQuestao(prova.questions[posicao + 1].id)} scroll={false} className="inline-flex items-center gap-1 font-sans text-sm text-primary hover:underline">
                      Próxima questão
                      <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
