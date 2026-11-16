import type { Prisma } from "@/app/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { DIAS_RESERVA_PENDENTE } from "@/lib/modalidades";

type Db = Prisma.TransactionClient | typeof prisma;

/**
 * Vagas presenciais ocupadas: matrículas presenciais ativas ou concluídas, mais
 * as pendentes recentes (pagamento em andamento). Uma pendente abandonada há
 * mais de DIAS_RESERVA_PENDENTE dias libera a vaga para outra pessoa.
 * `exceto` deixa de fora a matrícula da própria pessoa (nova tentativa de compra).
 */
export function presenciaisOcupadas(db: Db, courseId: string, exceto?: { userId: string }, agora = new Date()) {
  const desde = new Date(agora.getTime() - DIAS_RESERVA_PENDENTE * 24 * 60 * 60 * 1000);
  return db.enrollment.count({
    where: {
      courseId,
      modalidade: "PRESENCIAL",
      ...(exceto ? { userId: { not: exceto.userId } } : {}),
      OR: [
        { status: { in: ["ACTIVE", "COMPLETED"] } },
        { status: "PENDING", enrolledAt: { gte: desde } },
        { status: "PENDING", payments: { some: { createdAt: { gte: desde } } } },
      ],
    },
  });
}
