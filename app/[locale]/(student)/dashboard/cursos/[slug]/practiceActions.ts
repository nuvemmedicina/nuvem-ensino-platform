"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * Modo treino: praticar as questões da prova sem valer nota, com a
 * justificativa aparecendo na hora.
 *
 * O gabarito nunca é enviado ao navegador: as questões vão sem indicação de
 * qual alternativa é a certa, e cada resposta é conferida no servidor, uma a
 * uma. Assim o modo treino não vira uma forma de baixar o gabarito inteiro.
 */

export type QuestaoTreino = {
  id: string;
  text: string;
  topic: string | null;
  options: { id: string; text: string }[];
};

export type InicioTreino =
  | { ok: true; questoes: QuestaoTreino[] }
  | { ok: false; error: string };

/** Embaralha usando Fisher-Yates. Aqui a ordem pode ser aleatória de verdade. */
function embaralhar<T>(itens: T[]): T[] {
  const out = itens.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const QUESTOES_POR_TREINO = 10;

export async function iniciarTreino(quizId: string): Promise<InicioTreino> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sessão expirada. Entre novamente." };
  const userId = session.user.id;

  const quiz = await prisma.moduleQuiz.findUnique({
    where: { id: quizId },
    include: {
      module: { select: { releaseDate: true } },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!quiz) return { ok: false, error: "Prova não encontrada." };
  if (!quiz.practiceEnabled) return { ok: false, error: "O modo treino não está liberado nesta prova." };
  if (quiz.module.releaseDate && new Date() < quiz.module.releaseDate) {
    return { ok: false, error: "Este módulo ainda não foi liberado." };
  }
  if (quiz.questions.length === 0) return { ok: false, error: "Esta prova ainda não tem questões." };

  // Prioriza o que o aluno ainda não acertou no treino: repetir o que já domina
  // ensina pouco.
  const acertadas = await prisma.moduleQuizPractice.findMany({
    where: { userId, quizId, correct: true },
    select: { questionId: true },
    distinct: ["questionId"],
  });
  const jaAcertou = new Set(acertadas.map((a) => a.questionId));

  const pendentes = embaralhar(quiz.questions.filter((q) => !jaAcertou.has(q.id)));
  const revisao = embaralhar(quiz.questions.filter((q) => jaAcertou.has(q.id)));
  const escolhidas = [...pendentes, ...revisao].slice(0, QUESTOES_POR_TREINO);

  return {
    ok: true,
    questoes: escolhidas.map((q) => ({
      id: q.id,
      text: q.text,
      topic: q.topic,
      options: embaralhar(q.options).map((o) => ({ id: o.id, text: o.text })),
    })),
  };
}

export type RespostaTreino =
  | {
      ok: true;
      acertou: boolean;
      opcaoCorretaId: string;
      textoCorreto: string;
      justificativa: string | null;
    }
  | { ok: false; error: string };

export async function responderTreino(
  quizId: string,
  questionId: string,
  optionId: string,
): Promise<RespostaTreino> {
  const session = await auth();
  if (!session?.user?.id) return { ok: false, error: "Sessão expirada. Entre novamente." };
  const userId = session.user.id;

  const questao = await prisma.moduleQuizQuestion.findUnique({
    where: { id: questionId },
    include: {
      options: { select: { id: true, text: true, isCorrect: true } },
      quiz: { select: { id: true, practiceEnabled: true } },
    },
  });
  if (!questao || questao.quiz.id !== quizId) return { ok: false, error: "Questão não encontrada." };
  if (!questao.quiz.practiceEnabled) return { ok: false, error: "O modo treino não está liberado." };

  const correta = questao.options.find((o) => o.isCorrect);
  if (!correta) return { ok: false, error: "Esta questão está sem gabarito definido." };

  const acertou = optionId === correta.id;

  await prisma.moduleQuizPractice.create({
    data: { quizId, userId, questionId, correct: acertou },
  });

  return {
    ok: true,
    acertou,
    opcaoCorretaId: correta.id,
    textoCorreto: correta.text,
    justificativa: questao.explanation,
  };
}
