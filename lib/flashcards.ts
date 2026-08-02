import { prisma } from "@/lib/prisma";

export type CardEntrada = { id?: string; front: string; back: string };

/**
 * Quem pode estudar um grupo de flashcards.
 *
 * Grupo vinculado a um curso é dos matriculados nele — mesma regra do fórum e
 * da avaliação do curso, onde ACTIVE e COMPLETED liberam e o resto não.
 * Grupo sem curso é material solto, aberto a qualquer aluno logado.
 * Quem cuida do conteúdo enxerga tudo, para poder conferir antes de publicar.
 */
export async function podeEstudarGrupo(
  userId: string,
  role: string | undefined,
  courseId: string | null,
): Promise<boolean> {
  if (role === "ADMIN" || role === "EDITOR" || role === "INSTRUCTOR") return true;
  if (!courseId) return true;

  const matricula = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
    select: { status: true },
  });
  return matricula?.status === "ACTIVE" || matricula?.status === "COMPLETED";
}

/** Grupos que este usuário pode estudar, com a contagem de cards. */
export async function gruposParaUsuario(userId: string, role: string | undefined) {
  const grupos = await prisma.flashcardGroup.findMany({
    where: { cards: { some: {} } }, // grupo vazio não tem o que estudar
    orderBy: { createdAt: "desc" },
    select: {
      id: true, title: true, description: true, courseId: true,
      course: { select: { title: true, thumbnailUrl: true } },
      _count: { select: { cards: true } },
    },
  });

  const liberados = await Promise.all(
    grupos.map(async (g) => ((await podeEstudarGrupo(userId, role, g.courseId)) ? g : null)),
  );
  return liberados.filter((g): g is NonNullable<typeof g> => g !== null);
}

/**
 * Sincroniza os cards de um grupo com a lista vinda da tela de edição.
 *
 * Atualiza card a card em vez de recriar tudo, de propósito: apagar um
 * Flashcard leva junto os FlashcardReview dele — ou seja, o histórico de
 * estudo do aluno. Só desaparece o card que a coordenação removeu.
 *
 * Card sem id é novo. Card existente ausente da lista é removido.
 */
export async function sincronizarCards(groupId: string, cards: CardEntrada[]) {
  return prisma.$transaction(async (tx) => {
    const atuais = await tx.flashcard.findMany({ where: { groupId }, select: { id: true } });
    const mantidos = new Set(cards.map((c) => c.id).filter(Boolean) as string[]);

    const removidos = atuais.filter((c) => !mantidos.has(c.id)).map((c) => c.id);
    if (removidos.length) await tx.flashcard.deleteMany({ where: { id: { in: removidos } } });

    let criados = 0;
    for (const [ordem, card] of cards.entries()) {
      if (card.id && mantidos.has(card.id)) {
        await tx.flashcard.update({
          where: { id: card.id },
          data: { front: card.front, back: card.back, order: ordem },
        });
      } else {
        await tx.flashcard.create({
          data: { groupId, front: card.front, back: card.back, order: ordem },
        });
        criados++;
      }
    }

    return { atualizados: cards.length - criados, criados, removidos: removidos.length };
  });
}
