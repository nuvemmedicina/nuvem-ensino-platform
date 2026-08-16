import { Star, MessageSquareQuote, ThumbsUp, ThumbsDown, Users } from "lucide-react";

export type Resumo = {
  total: number;
  matriculas: number;
  medias: { overall: number; content: number; instructor: number; platform: number } | null;
  recomendam: number;
};

export type Avaliacao = {
  id: string;
  aluno: string;
  email: string;
  curso: string;
  data: string;
  overall: number;
  content: number;
  instructor: number;
  platform: number;
  recomenda: boolean;
  highlight: string | null;
  suggestion: string | null;
};

export type PorCurso = { id: string; titulo: string; total: number; matriculas: number; media: number };

export type PorDocente = {
  id: string;
  nome: string;
  fotoUrl: string | null;
  total: number;
  media: number;
  sugestoes: { id: string; texto: string; aluno: string; curso: string; data: string }[];
};

type Props = {
  cursos: { id: string; title: string }[];
  courseId?: string;
  resumo: Resumo;
  porCurso: PorCurso[];
  porDocente: PorDocente[];
  avaliacoes: Avaliacao[];
};

const NOTAS: { chave: keyof NonNullable<Resumo["medias"]>; label: string }[] = [
  { chave: "overall", label: "Geral" },
  { chave: "content", label: "Conteúdo" },
  { chave: "instructor", label: "Docentes" },
  { chave: "platform", label: "Plataforma" },
];

function Estrelas({ nota, tamanho = 14 }: { nota: number; tamanho?: number }) {
  return (
    <span className="inline-flex gap-0.5 align-middle" aria-label={`${nota} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          width={tamanho}
          height={tamanho}
          strokeWidth={1.5}
          fill={nota >= i - 0.25 ? "#f59e0b" : "none"}
          stroke={nota >= i - 0.25 ? "#f59e0b" : "var(--color-border)"}
        />
      ))}
    </span>
  );
}

function Media({ label, valor }: { label: string; valor: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <span className="font-sans text-xs text-muted">{label}</span>
        <span className="font-sans text-sm font-bold text-foreground tabular-nums">
          {valor.toFixed(1).replace(".", ",")}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
        <div className="h-full rounded-full bg-amber-500" style={{ width: `${(valor / 5) * 100}%` }} />
      </div>
    </div>
  );
}

function BlocoDocentes({ porDocente }: { porDocente: PorDocente[] }) {
  const totalNotas = porDocente.reduce((s, d) => s + d.total, 0);

  return (
    <div className="rounded-2xl border border-border bg-surface overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
          Por docente · {totalNotas} nota{totalNotas !== 1 ? "s" : ""}
        </p>
        <p className="font-sans text-xs text-muted mt-0.5">
          Cada professor vê a própria média e estes comentários sem identificação.
        </p>
      </div>

      {porDocente.length === 0 ? (
        <p className="px-5 py-8 font-sans text-sm text-muted text-center">
          Nenhum docente avaliado ainda. O bloco aparece na página de avaliação do curso, abaixo das notas gerais.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {porDocente.map((d) => (
            <li key={d.id} className="px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 border border-border shrink-0">
                  {d.fotoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={d.fotoUrl} alt={d.nome} className="w-full h-full object-cover object-top" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-sm font-semibold text-foreground truncate">{d.nome}</p>
                  <p className="font-sans text-xs text-muted">
                    {d.total} nota{d.total !== 1 ? "s" : ""}
                    <span className="mx-1.5 text-border">·</span>
                    {d.sugestoes.length} comentário{d.sugestoes.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-sans text-lg font-bold text-foreground tabular-nums mr-2">
                    {d.media.toFixed(1).replace(".", ",")}
                  </span>
                  <Estrelas nota={d.media} tamanho={12} />
                </div>
              </div>

              {d.sugestoes.length > 0 && (
                <ul className="mt-3 space-y-2 border-t border-border/60 pt-3">
                  {d.sugestoes.map((s) => (
                    <li key={s.id}>
                      <p className="font-serif text-[15px] text-foreground leading-relaxed">“{s.texto}”</p>
                      <p className="font-sans text-xs text-muted mt-1">
                        {s.aluno}
                        <span className="mx-1.5 text-border">·</span>
                        {s.data}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AvaliacoesView({ cursos, courseId, resumo, porCurso, porDocente, avaliacoes }: Props) {
  const taxa = resumo.matriculas > 0 ? (resumo.total / resumo.matriculas) * 100 : 0;
  const comentarios = avaliacoes.filter((a) => a.highlight || a.suggestion);
  const sugestoes = avaliacoes.filter((a) => a.suggestion);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-medium text-foreground">Avaliações</h1>
          <p className="font-sans text-sm text-muted mt-0.5">
            O que os alunos responderam no formulário de avaliação do curso.
          </p>
        </div>

        {/* Filtro por curso — form nativo, sem JS */}
        <form className="flex items-center gap-2">
          <select
            name="courseId"
            defaultValue={courseId ?? ""}
            className="font-sans text-sm text-foreground bg-background border border-border rounded-xl px-3 py-2 max-w-[18rem] focus:outline-none focus:border-primary/50"
          >
            <option value="">Todos os cursos</option>
            {cursos.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title.length > 50 ? c.title.slice(0, 50) + "…" : c.title}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="font-sans text-sm font-semibold px-4 py-2 rounded-xl bg-primary text-white hover:bg-primary-dark transition-colors"
          >
            Filtrar
          </button>
        </form>
      </div>

      {resumo.total === 0 && porDocente.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface px-6 py-12 text-center">
          <MessageSquareQuote className="w-8 h-8 text-muted/40 mx-auto mb-3" />
          <p className="font-sans text-sm font-medium text-foreground">Nenhuma avaliação recebida ainda</p>
          <p className="font-sans text-sm text-muted mt-1">
            {resumo.matriculas > 0
              ? `${resumo.matriculas} ${resumo.matriculas === 1 ? "aluno pode" : "alunos podem"} avaliar. O formulário fica em "Avaliação do curso", dentro da página do curso.`
              : "Ainda não há alunos matriculados neste recorte."}
          </p>
        </div>
      ) : (
        <>
          {/* Resumo */}
          {resumo.total > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Respostas</p>
              <p className="font-sans text-3xl font-bold text-foreground">{resumo.total}</p>
              <p className="font-sans text-xs text-muted mt-1 flex items-center gap-1">
                <Users className="w-3 h-3 shrink-0" />
                {taxa.toFixed(0)}% de {resumo.matriculas} matriculados
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Nota geral</p>
              <div className="flex items-baseline gap-2">
                <p className="font-sans text-3xl font-bold text-foreground">
                  {resumo.medias!.overall.toFixed(1).replace(".", ",")}
                </p>
                <span className="font-sans text-sm text-muted">/ 5</span>
              </div>
              <div className="mt-1.5">
                <Estrelas nota={resumo.medias!.overall} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted mb-2">Recomendariam</p>
              <p className="font-sans text-3xl font-bold text-foreground">
                {Math.round((resumo.recomendam / resumo.total) * 100)}%
              </p>
              <p className="font-sans text-xs text-muted mt-1">
                {resumo.recomendam} de {resumo.total} alunos
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">Médias por eixo</p>
              {NOTAS.map((n) => (
                <Media key={n.chave} label={n.label} valor={resumo.medias![n.chave]} />
              ))}
            </div>
          </div>
          )}

          {/* Docentes — a nota individual que a direção pediu */}
          <BlocoDocentes porDocente={porDocente} />

          {/* Sugestões de melhoria — o que a direção pediu para ler */}
          {resumo.total > 0 && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
                Sugestões de melhoria · {sugestoes.length}
              </p>
              <p className="font-sans text-xs text-muted mt-0.5">
                O que os alunos escreveram quando perguntados como melhorar o curso.
              </p>
            </div>
            {sugestoes.length === 0 ? (
              <p className="px-5 py-8 font-sans text-sm text-muted text-center">
                Nenhum aluno escreveu sugestão ainda.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {sugestoes.map((a) => (
                  <li key={a.id} className="px-5 py-4">
                    <p className="font-serif text-[15px] text-foreground leading-relaxed">“{a.suggestion}”</p>
                    <p className="font-sans text-xs text-muted mt-2">
                      {a.aluno} <span className="mx-1.5 text-border">·</span> {a.curso}
                      <span className="mx-1.5 text-border">·</span> {a.data}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
          )}

          {/* Por curso — só quando não há filtro */}
          {!courseId && porCurso.length > 1 && (
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">Por curso</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left font-sans text-[10px] font-bold uppercase tracking-widest text-muted px-5 py-2.5">Curso</th>
                      <th className="text-right font-sans text-[10px] font-bold uppercase tracking-widest text-muted px-5 py-2.5">Respostas</th>
                      <th className="text-right font-sans text-[10px] font-bold uppercase tracking-widest text-muted px-5 py-2.5">Nota</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {porCurso.map((c) => (
                      <tr key={c.id}>
                        <td className="px-5 py-3 font-sans text-sm text-foreground">{c.titulo}</td>
                        <td className="px-5 py-3 font-sans text-sm text-muted text-right tabular-nums whitespace-nowrap">
                          {c.total} <span className="text-muted/60">de {c.matriculas}</span>
                        </td>
                        <td className="px-5 py-3 text-right whitespace-nowrap">
                          <span className="font-sans text-sm font-semibold text-foreground tabular-nums mr-2">
                            {c.media.toFixed(1).replace(".", ",")}
                          </span>
                          <Estrelas nota={c.media} tamanho={12} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Respostas, uma a uma */}
          {resumo.total > 0 && (
          <div className="rounded-2xl border border-border bg-surface overflow-hidden">
            <div className="px-5 py-4 border-b border-border">
              <p className="font-sans text-xs font-bold uppercase tracking-widest text-muted">
                Respostas · {avaliacoes.length}
              </p>
            </div>
            <ul className="divide-y divide-border">
              {avaliacoes.map((a) => (
                <li key={a.id} className="px-5 py-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-sans text-sm font-semibold text-foreground">{a.aluno}</p>
                      <p className="font-sans text-xs text-muted truncate">
                        {a.email} <span className="mx-1 text-border">·</span> {a.curso}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 font-sans text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                          a.recomenda
                            ? "text-green-700 bg-green-500/10 border-green-500/20"
                            : "text-red-600 bg-red-500/10 border-red-500/20"
                        }`}
                      >
                        {a.recomenda ? <ThumbsUp className="w-3 h-3" /> : <ThumbsDown className="w-3 h-3" />}
                        {a.recomenda ? "Recomendaria" : "Não recomendaria"}
                      </span>
                      <span className="font-sans text-xs text-muted whitespace-nowrap">{a.data}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-5 gap-y-2 mt-3">
                    {NOTAS.map((n) => (
                      <div key={n.chave} className="flex items-center justify-between gap-2">
                        <span className="font-sans text-xs text-muted">{n.label}</span>
                        <Estrelas nota={a[n.chave]} tamanho={12} />
                      </div>
                    ))}
                  </div>

                  {(a.highlight || a.suggestion) && (
                    <div className="mt-3 space-y-2 border-t border-border/60 pt-3">
                      {a.highlight && (
                        <p className="font-sans text-sm text-foreground leading-snug">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-green-600 mr-2">
                            Gostou
                          </span>
                          {a.highlight}
                        </p>
                      )}
                      {a.suggestion && (
                        <p className="font-sans text-sm text-foreground leading-snug">
                          <span className="font-sans text-[10px] font-bold uppercase tracking-widest text-primary mr-2">
                            Sugere
                          </span>
                          {a.suggestion}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
          )}

          {resumo.total > 0 && (
            <p className="font-sans text-xs text-muted">
              {comentarios.length} de {resumo.total} respostas trazem comentário escrito.
            </p>
          )}
        </>
      )}
    </div>
  );
}
