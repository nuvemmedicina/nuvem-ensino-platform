"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { AnswerMode, ConfidenceLevel, StatMap } from "@/lib/respiratoryGame/logic";

export type RespiratoryProgressData = {
  totalAnswered: number;
  totalCorrect: number;
  bestStreak: number;
  conceptStats: StatMap;
  skillStats: StatMap;
  confidenceErrors: Record<string, number>;
  errorCaseIds: string[];
};

const EMPTY_PROGRESS: RespiratoryProgressData = {
  totalAnswered: 0,
  totalCorrect: 0,
  bestStreak: 0,
  conceptStats: {},
  skillStats: {},
  confidenceErrors: {},
  errorCaseIds: [],
};

export async function getRespiratoryGameProgress(): Promise<RespiratoryProgressData> {
  const session = await auth();
  if (!session?.user?.id) return EMPTY_PROGRESS;

  const row = await prisma.respiratoryGameProgress.findUnique({ where: { userId: session.user.id } });
  if (!row) return EMPTY_PROGRESS;

  return {
    totalAnswered: row.totalAnswered,
    totalCorrect: row.totalCorrect,
    bestStreak: row.bestStreak,
    conceptStats: row.conceptStats as StatMap,
    skillStats: row.skillStats as StatMap,
    confidenceErrors: row.confidenceErrors as Record<string, number>,
    errorCaseIds: row.errorCaseIds,
  };
}

type RecordAnswerInput = {
  caseId: string;
  category: string;
  conceptKey: string;
  correct: boolean;
  mode: AnswerMode;
  confidence: ConfidenceLevel;
  streakAfterAnswer: number;
  reviewMode: boolean;
};

function bump(stats: StatMap, key: string, correct: boolean): StatMap {
  const current = stats[key] ?? { n: 0, ok: 0 };
  return { ...stats, [key]: { n: current.n + 1, ok: current.ok + (correct ? 1 : 0) } };
}

/**
 * Registra a resposta de um caso do jogo, no mesmo espírito do `record()` do
 * app original: conta acerto/erro por conceito e por categoria, atualiza a
 * fila de revisão e mantém a melhor sequência — só que persistido por aluno.
 */
export async function recordRespiratoryGameAnswer(input: RecordAnswerInput): Promise<RespiratoryProgressData> {
  const session = await auth();
  if (!session?.user?.id) return EMPTY_PROGRESS;
  const userId = session.user.id;

  const existing = await prisma.respiratoryGameProgress.findUnique({ where: { userId } });
  const current: RespiratoryProgressData = existing
    ? {
        totalAnswered: existing.totalAnswered,
        totalCorrect: existing.totalCorrect,
        bestStreak: existing.bestStreak,
        conceptStats: existing.conceptStats as StatMap,
        skillStats: existing.skillStats as StatMap,
        confidenceErrors: existing.confidenceErrors as Record<string, number>,
        errorCaseIds: existing.errorCaseIds,
      }
    : EMPTY_PROGRESS;

  const conceptStats = bump(current.conceptStats, input.conceptKey, input.correct);
  const skillStats = bump(current.skillStats, input.category, input.correct);

  let errorCaseIds = current.errorCaseIds;
  if (!input.correct) {
    if (!errorCaseIds.includes(input.caseId)) errorCaseIds = [...errorCaseIds, input.caseId];
  } else if (input.reviewMode) {
    errorCaseIds = errorCaseIds.filter((id) => id !== input.caseId);
  }

  const confidenceErrors = { ...current.confidenceErrors };
  if (!input.correct && input.confidence === "alta") {
    confidenceErrors[input.conceptKey] = (confidenceErrors[input.conceptKey] ?? 0) + 1;
  }

  const updated: RespiratoryProgressData = {
    totalAnswered: current.totalAnswered + 1,
    totalCorrect: current.totalCorrect + (input.correct ? 1 : 0),
    bestStreak: Math.max(current.bestStreak, input.streakAfterAnswer),
    conceptStats,
    skillStats,
    confidenceErrors,
    errorCaseIds,
  };

  await prisma.$transaction([
    prisma.respiratoryGameProgress.upsert({
      where: { userId },
      create: { userId, ...updated },
      update: updated,
    }),
    prisma.respiratoryGameAnswer.create({
      data: {
        userId,
        caseId: input.caseId,
        correct: input.correct,
        mode: input.mode,
        confidence: input.confidence,
      },
    }),
  ]);

  return updated;
}
