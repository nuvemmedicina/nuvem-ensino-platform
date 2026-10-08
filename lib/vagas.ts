import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Vagas de curso com limite (Course.totalSeats).
 *
 * Course.reservedSeats era mantido com +1 e −1 espalhados pelo checkout, pela
 * matrícula gratuita, pelos webhooks e pelo cancelamento do admin, com regras
 * que não batiam: a compra só reservava em curso com limite, mas cancelamento
 * e reembolso descontavam sempre; matrícula reativada não reservava de novo.
 * Em 08/10/2026 o contador da Fisioterapia Pélvica estava em 0 com 1 aluno
 * (a página mostrava 2 vagas de 2) e o do DICI em −5.
 *
 * Agora a vaga ocupada é sempre a contagem das matrículas que ocupam lugar, e
 * reservedSeats só guarda esse número para as telas que o exibem.
 */

export const STATUS_QUE_OCUPAM_VAGA = ["PENDING", "ACTIVE", "COMPLETED"] as const;

type Db = Prisma.TransactionClient | typeof prisma;

/** Matrículas que ocupam vaga no curso; `exceto` deixa de fora a da própria pessoa (nova tentativa de compra). */
export function vagasOcupadas(db: Db, courseId: string, exceto?: { userId: string }) {
  return db.enrollment.count({
    where: {
      courseId,
      status: { in: [...STATUS_QUE_OCUPAM_VAGA] },
      ...(exceto ? { userId: { not: exceto.userId } } : {}),
    },
  });
}

/** Regrava Course.reservedSeats com a contagem real. Chamar depois de mudar o status de uma matrícula. */
export async function sincronizarVagas(db: Db, courseId: string) {
  const n = await vagasOcupadas(db, courseId);
  await db.course.update({ where: { id: courseId }, data: { reservedSeats: n } });
  return n;
}
