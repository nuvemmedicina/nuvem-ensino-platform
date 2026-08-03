import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcularDominioPorTema } from "@/lib/gamification";
import { TrendingUp, Users, GraduationCap, Target, AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";
import { cursosDoInstrutor } from "@/lib/instructorAccess";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ curso?: string }>;
};

/** Dias sem nenhuma aula concluída ou prova feita para o aluno virar alerta. */
const DIAS_INATIVO = 14;

/**
 * Instante da renderização. Fica fora do componente porque o lint de pureza do
 * React proíbe chamar Date.now() durante o render — aqui é um Server Component
 * que roda uma vez por requisição, então o valor é estável dentro da página.
 */
function instanteAtual(): number {
  return Date.now();
}

const pctColor = (pct: number) =>
  pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
const barColor = (pct: number) =>
  pct >= 80 ? "bg-green-500" : pct >= 50 ? "bg-amber-400" : "bg-red-400";

export default async function EvolucaoAlunosPage({ params, searchParams }: Props) {
  await params;

  const session = await auth();
  if (!session?.user?.id) redirect("/entrar?callbackUrl=/instrutor/evolucao");

  const instructor = await prisma.instructor.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!instructor) redirect("/instrutor");

  const myCourses = await prisma.course.findMany({
    where: cursosDoInstrutor(instructor.id),
    select: {
      id: true, title: true, slug: true, startDate: true, startDateLabel: true,
      _count: { select: { enrollments: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  if (myCourses.length === 0) {
    return (
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-foreground">Evolução dos Alunos</h1>
        <div className="mt-6 bg-surface border border-border rounded-2xl p-10 text-center">
          <p className="font-sans text-sm text-muted">Nenhum curso atribuído a você ainda.</p>
        </div>
      </div>
    );
  }

  const { curso } = await searchParams;
  const course = myCourses.find((c) => c.slug === curso) ?? myCourses[0];

  // ── Dados da turma ────────────────────────────────────────────────────────
  const [totalAulas, enrollments, quizzes, tentativas, dominio] = await Promise.all([
    prisma.lesson.count({ where: { module: { courseId: course.id } } }),
    prisma.enrollment.findMany({
      where: { courseId: course.id, status: { in: ["ACTIVE", "COMPLETED"] } },
      select: {
        id: true,
        enrolledAt: true,
        status: true,
        user: { select: { id: true, name: true, email: true } },
        progress: { where: { completed: true }, select: { completedAt: true, updatedAt: true } },
      },
    }),
    prisma.moduleQuiz.findMany({
      where: { module: { courseId: course.id } },
      select: { id: true, title: true, passingPct: true, module: { select: { title: true, order: true } } },
    }),
    prisma.moduleQuizAttempt.findMany({
      where: { quiz: { module: { courseId: course.id } } },
      select: { userId: true, quizId: true, score: true, total: true, passed: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    calcularDominioPorTema(course.id),
  ]);

  // Tentativas agrupadas por aluno
  const porAluno = new Map<string, typeof tentativas>();
  for (const t of tentativas) {
    const lista = porAluno.get(t.userId) ?? [];
    lista.push(t);
    porAluno.set(t.userId, lista);
  }

  const agora = instanteAtual();
  const limiteInativo = agora - DIAS_INATIVO * 24 * 60 * 60 * 1000;

  // Turma que ainda não começou não tem "aluno parado": todo mundo estaria sem
  // atividade só porque as aulas não abriram. O alerta fica suspenso até lá.
  const cursoNaoComecou = course.startDate !== null && course.startDate.getTime() > agora;

  // Curso cujo conteúdo não vive na plataforma (aula gravada externa, turma
  // presencial) não tem progresso a acompanhar — não faz sentido cobrar ninguém.
  const semConteudo = totalAulas === 0 && quizzes.length === 0;

  const alertaSuspenso = cursoNaoComecou || semConteudo;

  const alunos = enrollments.map((e) => {
    const feitas = e.progress.length;
    const pctAulas = totalAulas > 0 ? Math.round((feitas / totalAulas) * 100) : 0;

    const minhas = porAluno.get(e.user.id) ?? [];
    const provasFeitas = new Set(minhas.map((t) => t.quizId)).size;
    const provasAprovadas = new Set(minhas.filter((t) => t.passed).map((t) => t.quizId)).size;

    // Melhor aproveitamento entre todas as tentativas
    const melhorPct = minhas.length
      ? Math.max(...minhas.map((t) => (t.total > 0 ? Math.round((t.score / t.total) * 100) : 0)))
      : null;

    const datas = [
      ...e.progress.map((p) => (p.completedAt ?? p.updatedAt).getTime()),
      ...minhas.map((t) => t.createdAt.getTime()),
    ];
    const ultimaAtividade = datas.length ? Math.max(...datas) : null;
    // Quem nunca teve atividade é medido a partir da matrícula — assim quem
    // acabou de entrar não aparece como parado.
    const referencia = ultimaAtividade ?? e.enrolledAt.getTime();

    return {
      id: e.id,
      nome: e.user.name ?? "—",
      email: e.user.email,
      feitas,
      pctAulas,
      provasFeitas,
      provasAprovadas,
      melhorPct,
      ultimaAtividade,
      semAtividade: ultimaAtividade === null,
      inativo: !alertaSuspenso && referencia < limiteInativo,
    };
  });

  alunos.sort((a, b) => b.pctAulas - a.pctAulas || a.nome.localeCompare(b.nome, "pt-BR"));

  // ── Indicadores da turma ──────────────────────────────────────────────────
  const totalAlunos = alunos.length;
  const progressoMedio = totalAlunos
    ? Math.round(alunos.reduce((s, a) => s + a.pctAulas, 0) / totalAlunos)
    : 0;
  const concluiramTudo = alunos.filter((a) => totalAulas > 0 && a.feitas >= totalAulas).length;
  const nuncaComecaram = alunos.filter((a) => a.semAtividade).length;
  const precisamAtencao = alertaSuspenso ? [] : alunos.filter((a) => a.inativo);

  const totalProvas = quizzes.length;
  const alunosComProva = alunos.filter((a) => a.provasFeitas > 0).length;
  const aprovacaoMedia = alunosComProva
    ? Math.round(
        (alunos.filter((a) => a.provasFeitas > 0).reduce((s, a) => s + (a.melhorPct ?? 0), 0) /
          alunosComProva),
      )
    : 0;

  const fmtData = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
  const fmtDataLonga = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const diasAtras = (ms: number) => Math.floor((agora - ms) / (24 * 60 * 60 * 1000));

  const kpis = [
    { icon: Users,         label: "Alunos ativos",     valor: String(totalAlunos),        nota: `${concluiramTudo} concluíram o curso`, cor: "text-primary",    bg: "bg-primary/5",     ring: "ring-primary/20" },
    { icon: TrendingUp,    label: "Progresso médio",   valor: `${progressoMedio}%`,       nota: `de ${totalAulas} aulas no curso`,      cor: "text-teal-600",   bg: "bg-teal-500/5",    ring: "ring-teal-500/20" },
    { icon: GraduationCap, label: "Aproveitamento",    valor: alunosComProva ? `${aprovacaoMedia}%` : "—", nota: `${alunosComProva} de ${totalAlunos} fizeram prova`, cor: "text-violet-600", bg: "bg-violet-500/5",  ring: "ring-violet-500/20" },
    {
      icon: AlertTriangle,
      label: "Precisam de apoio",
      valor: alertaSuspenso ? "—" : String(precisamAtencao.length),
      nota: cursoNaoComecou
        ? "aguardando o início da turma"
        : semConteudo
          ? "curso sem conteúdo na plataforma"
          : `sem atividade há ${DIAS_INATIVO}+ dias`,
      cor: "text-amber-600", bg: "bg-amber-500/5", ring: "ring-amber-500/20",
    },
  ];

  return (
    <div className="max-w-6xl">
      {/* ── Cabeçalho ── */}
      <div className="mb-6">
        <h1 className="font-serif text-2xl sm:text-3xl font-light text-foreground">Evolução dos Alunos</h1>
        <p className="font-sans text-sm text-muted mt-1">
          Como a turma está avançando nas aulas e nas provas
        </p>
      </div>

      {/* ── Seletor de curso ── */}
      {myCourses.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
          {myCourses.map((c) => (
            <Link
              key={c.id}
              href={`/instrutor/evolucao?curso=${c.slug}`}
              aria-current={c.id === course.id ? "page" : undefined}
              className={`shrink-0 font-sans text-xs font-semibold px-3.5 py-2 rounded-full border transition-colors ${
                c.id === course.id
                  ? "bg-primary text-white border-primary"
                  : "bg-surface text-muted border-border hover:text-foreground hover:border-primary/40"
              }`}
            >
              {c.title.length > 38 ? `${c.title.slice(0, 38)}…` : c.title}
            </Link>
          ))}
        </div>
      )}

      <p className="font-sans text-xs text-muted mb-4">
        {course.title} · {totalAulas} aula{totalAulas !== 1 ? "s" : ""} · {totalProvas} prova{totalProvas !== 1 ? "s" : ""}
      </p>

      {/* Curso sem aulas nem provas cadastradas: não há o que acompanhar aqui */}
      {semConteudo && !cursoNaoComecou && (
        <div className="flex items-start gap-3 bg-surface border border-border rounded-2xl px-4 sm:px-5 py-4 mb-6">
          <CalendarClock className="w-4 h-4 text-muted shrink-0 mt-0.5" />
          <p className="font-sans text-sm text-foreground leading-relaxed">
            Este curso não tem aulas nem provas cadastradas na plataforma — o conteúdo é entregue
            por fora (aula gravada, encontro ao vivo ou turma presencial). Por isso não há progresso
            a acompanhar, e a lista abaixo mostra só quem está matriculado.
          </p>
        </div>
      )}

      {/* Turma que ainda vai começar: explica por que os números estão zerados */}
      {cursoNaoComecou && (
        <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-4 sm:px-5 py-4 mb-6">
          <CalendarClock className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="font-sans text-sm text-foreground leading-relaxed">
            A turma ainda não começou
            {course.startDate && (
              <> — início em <b>{fmtDataLonga.format(course.startDate)}</b></>
            )}
            . Os indicadores de progresso ficam zerados até as aulas abrirem, e nenhum aluno é
            sinalizado como parado nesse período.
          </p>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
        {kpis.map(({ icon: Icon, label, valor, nota, cor, bg, ring }) => (
          <div key={label} className={`rounded-2xl border border-border ${bg} px-4 sm:px-5 py-4`}>
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-9 h-9 rounded-xl ring-1 ${ring} ${bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-4 h-4 ${cor}`} />
              </div>
              <p className="font-sans text-[10px] font-bold uppercase tracking-widest text-muted">{label}</p>
            </div>
            <p className={`font-serif text-3xl font-medium ${cor} leading-none`}>{valor}</p>
            <p className="font-sans text-xs text-muted mt-1.5">{nota}</p>
          </div>
        ))}
      </div>

      {/* ── Domínio por tema ── */}
      {dominio.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-primary shrink-0" />
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70">
              Domínio por tema
            </h2>
          </div>
          <p className="font-sans text-xs text-muted mb-4">
            Reconstruído das respostas das provas, do tema mais frágil ao mais sólido — é o que vale revisar em aula.
          </p>
          <div className="bg-surface border border-border rounded-2xl divide-y divide-border overflow-hidden">
            {dominio.map((t) => (
              <div key={t.tema} className="px-4 sm:px-5 py-3.5">
                <div className="flex items-baseline justify-between gap-3 mb-2">
                  <p className="font-sans text-sm text-foreground leading-snug">{t.tema}</p>
                  <div className="flex items-baseline gap-2 shrink-0">
                    <span className={`font-sans text-sm font-bold tabular-nums ${pctColor(t.pct)}`}>{t.pct}%</span>
                    <span className="font-sans text-[11px] text-muted tabular-nums">{t.acertos}/{t.total}</span>
                  </div>
                </div>
                <div className="h-1.5 rounded-full bg-border/60 overflow-hidden">
                  <div className={`h-full rounded-full ${barColor(t.pct)}`} style={{ width: `${t.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Precisam de apoio ── */}
      {precisamAtencao.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70">
              Precisam de apoio
            </h2>
          </div>
          <p className="font-sans text-xs text-muted mb-4">
            {nuncaComecaram > 0 && `${nuncaComecaram} nunca começaram. `}
            Alunos sem nenhuma aula ou prova nos últimos {DIAS_INATIVO} dias.
          </p>
          <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl divide-y divide-amber-500/15 overflow-hidden">
            {precisamAtencao.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3">
                <div className="min-w-0">
                  <p className="font-sans text-sm font-medium text-foreground truncate">{a.nome}</p>
                  <p className="font-sans text-xs text-muted truncate">{a.email}</p>
                </div>
                <span className="font-sans text-[11px] font-semibold text-amber-700 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full shrink-0 whitespace-nowrap">
                  {a.semAtividade ? "Nunca começou" : `${diasAtras(a.ultimaAtividade!)} dias parado`}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Lista completa ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
          <h2 className="font-sans text-xs font-bold uppercase tracking-widest text-foreground/70">
            Todos os alunos · {totalAlunos}
          </h2>
        </div>

        {totalAlunos === 0 ? (
          <div className="bg-surface border border-border rounded-2xl p-10 text-center">
            <p className="font-sans text-sm text-muted">Nenhum aluno matriculado ainda.</p>
          </div>
        ) : (
          <>
            {/* Celular: cartões */}
            <div className="sm:hidden flex flex-col gap-3">
              {alunos.map((a) => (
                <div key={a.id} className="bg-surface border border-border rounded-2xl p-4">
                  <p className="font-sans text-sm font-semibold text-foreground leading-snug">{a.nome}</p>
                  <p className="font-sans text-xs text-muted truncate mb-3">{a.email}</p>

                  <div className="flex items-baseline justify-between gap-2 mb-1.5">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-muted">Aulas</span>
                    <span className="font-sans text-xs text-muted tabular-nums">
                      <b className={`text-sm ${pctColor(a.pctAulas)}`}>{a.pctAulas}%</b> · {a.feitas}/{totalAulas}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-border/60 overflow-hidden mb-3">
                    <div className={`h-full rounded-full ${barColor(a.pctAulas)}`} style={{ width: `${a.pctAulas}%` }} />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-xs text-muted">
                    <span>
                      Provas <b className="text-foreground tabular-nums">{a.provasAprovadas}/{totalProvas}</b> aprovadas
                    </span>
                    {a.melhorPct !== null && (
                      <span>
                        Melhor nota <b className={`tabular-nums ${pctColor(a.melhorPct)}`}>{a.melhorPct}%</b>
                      </span>
                    )}
                    <span>
                      {a.ultimaAtividade ? `Ativo em ${fmtData.format(a.ultimaAtividade)}` : "Sem atividade"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Tablet e desktop: tabela */}
            <div className="hidden sm:block bg-surface border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-background">
                      <th className="text-left px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted">Aluno</th>
                      <th className="text-left px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted w-56">Progresso nas aulas</th>
                      <th className="text-center px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted">Provas</th>
                      <th className="text-center px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted hidden md:table-cell">Melhor nota</th>
                      <th className="text-right px-5 py-3 font-sans text-[11px] font-bold uppercase tracking-wider text-muted hidden lg:table-cell">Última atividade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {alunos.map((a) => (
                      <tr key={a.id} className="hover:bg-background/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="font-sans text-sm font-medium text-foreground leading-tight">{a.nome}</p>
                          <p className="font-sans text-xs text-muted">{a.email}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="flex-1 h-1.5 rounded-full bg-border/60 overflow-hidden min-w-[60px]">
                              <div className={`h-full rounded-full ${barColor(a.pctAulas)}`} style={{ width: `${a.pctAulas}%` }} />
                            </div>
                            <span className={`font-sans text-xs font-bold tabular-nums shrink-0 ${pctColor(a.pctAulas)}`}>
                              {a.pctAulas}%
                            </span>
                          </div>
                          <p className="font-sans text-[11px] text-muted mt-1 tabular-nums">
                            {a.feitas} de {totalAulas} aulas
                          </p>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="font-sans text-sm text-foreground tabular-nums">
                            {a.provasAprovadas}<span className="text-muted">/{totalProvas}</span>
                          </span>
                          {a.provasFeitas > a.provasAprovadas && (
                            <p className="font-sans text-[11px] text-amber-600">
                              {a.provasFeitas - a.provasAprovadas} sem aprovação
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center hidden md:table-cell">
                          {a.melhorPct === null ? (
                            <span className="font-sans text-xs text-muted">—</span>
                          ) : (
                            <span className={`font-sans text-sm font-semibold tabular-nums ${pctColor(a.melhorPct)}`}>
                              {a.melhorPct}%
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right hidden lg:table-cell whitespace-nowrap">
                          {a.ultimaAtividade ? (
                            <span className={`font-sans text-xs ${a.inativo ? "text-amber-600" : "text-muted"}`}>
                              {fmtData.format(a.ultimaAtividade)}
                            </span>
                          ) : (
                            <span className="font-sans text-xs text-amber-600">Nunca</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
