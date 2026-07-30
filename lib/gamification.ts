import { prisma } from "@/lib/prisma";

/**
 * Gamificação calculada, não acumulada.
 *
 * Nada aqui é gravado: pontos, ofensiva e medalhas são derivados do histórico
 * que a plataforma já registra (aulas concluídas, provas feitas, sessões de
 * flashcards, certificados). A consequência prática é que as regras abaixo
 * podem mudar a qualquer momento sem corromper saldo de ninguém, não existe
 * risco de contar duas vezes, e quem já estudou entra com o que merece.
 */

// ── Regras de pontuação ──────────────────────────────────────────────────────
export const XP = {
  lesson: 10,          // por aula concluída
  flashcardSession: 5, // por sessão de flashcards finalizada
  flashcardCard: 1,    // por card revisado
  quizPassed: 100,     // por prova aprovada
  firstTryBonus: 50,   // aprovado já na primeira tentativa
  perfectBonus: 50,    // prova sem nenhum erro
  certificate: 200,    // por certificado emitido
} as const;

const TZ = "America/Sao_Paulo";

/** Data no formato AAAA-MM-DD no fuso de Brasília (não em UTC). */
function diaBR(date: Date): string {
  // en-CA formata como AAAA-MM-DD
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(date);
}

/** Soma dias a uma data no formato AAAA-MM-DD. */
function somaDias(dia: string, delta: number): string {
  const [a, m, d] = dia.split("-").map(Number);
  const dt = new Date(Date.UTC(a, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + delta);
  return dt.toISOString().slice(0, 10);
}

export type Streak = { atual: number; recorde: number; diasAtivos: number; ultimoDia: string | null };

/**
 * Ofensiva a partir dos dias em que houve qualquer atividade.
 *
 * A sequência continua viva se o último dia ativo é hoje ou ontem — quem
 * estudou ontem à noite e ainda não abriu a plataforma hoje não perde a
 * sequência no meio do dia.
 */
export function calcularOfensiva(datas: Date[], hoje = new Date()): Streak {
  if (datas.length === 0) return { atual: 0, recorde: 0, diasAtivos: 0, ultimoDia: null };

  const dias = [...new Set(datas.map(diaBR))].sort();
  const hojeBR = diaBR(hoje);
  const ontemBR = somaDias(hojeBR, -1);
  const ultimo = dias[dias.length - 1];

  // Recorde: maior sequência de dias consecutivos em todo o histórico
  let recorde = 1;
  let corrente = 1;
  for (let i = 1; i < dias.length; i++) {
    if (dias[i] === somaDias(dias[i - 1], 1)) {
      corrente++;
      recorde = Math.max(recorde, corrente);
    } else {
      corrente = 1;
    }
  }

  // Atual: só conta se o último dia ativo for hoje ou ontem
  let atual = 0;
  if (ultimo === hojeBR || ultimo === ontemBR) {
    atual = 1;
    for (let i = dias.length - 1; i > 0; i--) {
      if (dias[i - 1] === somaDias(dias[i], -1)) atual++;
      else break;
    }
  }

  return { atual, recorde, diasAtivos: dias.length, ultimoDia: ultimo };
}

export type Medalha = {
  id: string;
  nome: string;
  descricao: string;
  conquistada: boolean;
  detalhe?: string;
};

export type PontosDetalhe = { rotulo: string; quantidade: number; pontos: number };

export type EstatisticasAluno = {
  xp: number;
  detalhe: PontosDetalhe[];
  ofensiva: Streak;
  medalhas: Medalha[];
  aulasConcluidas: number;
  provasAprovadas: number;
};

/** Estatísticas do aluno, calculadas do histórico. */
export async function calcularEstatisticas(userId: string): Promise<EstatisticasAluno> {
  const [progressos, sessoes, tentativas, certificados] = await Promise.all([
    prisma.progress.findMany({
      where: { completed: true, enrollment: { userId } },
      select: { completedAt: true, updatedAt: true },
    }),
    prisma.flashcardStudySession.findMany({
      where: { userId, finishedAt: { not: null } },
      select: { finishedAt: true, cardsReviewed: true },
    }),
    prisma.moduleQuizAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      select: { quizId: true, score: true, total: true, passed: true, createdAt: true },
    }),
    prisma.certificate.findMany({ where: { userId }, select: { issueDate: true } }),
  ]);

  // ── Provas: aprovação conta uma vez por prova ──────────────────────────────
  const porProva = new Map<string, typeof tentativas>();
  for (const t of tentativas) {
    const lista = porProva.get(t.quizId) ?? [];
    lista.push(t);
    porProva.set(t.quizId, lista);
  }

  let aprovadas = 0;
  let dePrimeira = 0;
  let semErro = 0;
  for (const lista of porProva.values()) {
    const idxAprovacao = lista.findIndex((t) => t.passed);
    if (idxAprovacao === -1) continue;
    aprovadas++;
    if (idxAprovacao === 0) dePrimeira++;
    if (lista.some((t) => t.passed && t.total > 0 && t.score === t.total)) semErro++;
  }

  const cardsRevisados = sessoes.reduce((s, x) => s + x.cardsReviewed, 0);

  const detalhe: PontosDetalhe[] = [
    { rotulo: "Aulas concluídas", quantidade: progressos.length, pontos: progressos.length * XP.lesson },
    { rotulo: "Sessões de flashcards", quantidade: sessoes.length, pontos: sessoes.length * XP.flashcardSession },
    { rotulo: "Cards revisados", quantidade: cardsRevisados, pontos: cardsRevisados * XP.flashcardCard },
    { rotulo: "Provas aprovadas", quantidade: aprovadas, pontos: aprovadas * XP.quizPassed },
    { rotulo: "Aprovado de primeira", quantidade: dePrimeira, pontos: dePrimeira * XP.firstTryBonus },
    { rotulo: "Prova sem erro", quantidade: semErro, pontos: semErro * XP.perfectBonus },
    { rotulo: "Certificados", quantidade: certificados.length, pontos: certificados.length * XP.certificate },
  ].filter((d) => d.quantidade > 0);

  const xp = detalhe.reduce((s, d) => s + d.pontos, 0);

  // ── Ofensiva: qualquer atividade conta ────────────────────────────────────
  const datas: Date[] = [
    ...progressos.map((p) => p.completedAt ?? p.updatedAt),
    ...sessoes.map((s) => s.finishedAt!),
    ...tentativas.map((t) => t.createdAt),
  ].filter(Boolean);
  const ofensiva = calcularOfensiva(datas);

  const medalhas: Medalha[] = [
    {
      id: "primeira-prova",
      nome: "Primeira conquista",
      descricao: "Aprovado em uma prova de módulo",
      conquistada: aprovadas >= 1,
    },
    {
      id: "de-primeira",
      nome: "De primeira",
      descricao: "Aprovado sem precisar de segunda tentativa",
      conquistada: dePrimeira >= 1,
    },
    {
      id: "sem-erro",
      nome: "Gabarito limpo",
      descricao: "Uma prova inteira sem nenhum erro",
      conquistada: semErro >= 1,
    },
    {
      id: "constante",
      nome: "Constância",
      descricao: "7 dias seguidos estudando",
      conquistada: ofensiva.recorde >= 7,
      detalhe: ofensiva.recorde > 0 ? `melhor sequência: ${ofensiva.recorde} dia(s)` : undefined,
    },
    {
      id: "curso-completo",
      nome: "Curso completo",
      descricao: "Aprovado nas quatro provas do curso",
      conquistada: aprovadas >= 4,
      detalhe: aprovadas > 0 ? `${aprovadas} de 4` : undefined,
    },
    {
      id: "certificado",
      nome: "Certificado em mãos",
      descricao: "Concluiu um curso e emitiu o certificado",
      conquistada: certificados.length >= 1,
    },
  ];

  return {
    xp,
    detalhe,
    ofensiva,
    medalhas,
    aulasConcluidas: progressos.length,
    provasAprovadas: aprovadas,
  };
}

export type DominioTema = { tema: string; acertos: number; total: number; pct: number };

/**
 * Desempenho por tema, reconstruído das respostas das provas.
 *
 * Cada tentativa guarda as questões que foram sorteadas e a alternativa que o
 * aluno marcou; cruzando com o tema e o gabarito de cada questão, sabemos em
 * que assunto ele acerta e em qual erra. Passando `userId`, é o desempenho do
 * aluno; sem ele, é o da turma inteira.
 */
export async function calcularDominioPorTema(
  courseId: string,
  userId?: string,
): Promise<DominioTema[]> {
  const tentativas = await prisma.moduleQuizAttempt.findMany({
    where: {
      ...(userId ? { userId } : {}),
      quiz: { module: { courseId } },
    },
    select: { answers: true, servedQuestionIds: true },
  });
  if (tentativas.length === 0) return [];

  const questoes = await prisma.moduleQuizQuestion.findMany({
    where: { quiz: { module: { courseId } } },
    select: { id: true, topic: true, options: { select: { id: true, isCorrect: true } } },
  });

  const mapa = new Map(
    questoes.map((q) => [
      q.id,
      { tema: q.topic ?? "Sem tema", correta: q.options.find((o) => o.isCorrect)?.id ?? null },
    ]),
  );

  const acc = new Map<string, { acertos: number; total: number }>();

  for (const t of tentativas) {
    const respostas = (t.answers ?? {}) as Record<string, string>;
    for (const qid of t.servedQuestionIds) {
      const q = mapa.get(qid);
      if (!q || !q.correta) continue;
      const atual = acc.get(q.tema) ?? { acertos: 0, total: 0 };
      atual.total++;
      if (respostas[qid] === q.correta) atual.acertos++;
      acc.set(q.tema, atual);
    }
  }

  return [...acc.entries()]
    .map(([tema, v]) => ({
      tema,
      acertos: v.acertos,
      total: v.total,
      pct: v.total > 0 ? Math.round((v.acertos / v.total) * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct); // mais fraco primeiro — é o que interessa ver
}
