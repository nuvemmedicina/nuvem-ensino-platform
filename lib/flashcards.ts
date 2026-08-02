import { prisma } from "@/lib/prisma";

export type CardEntrada = { id?: string; front: string; back: string };

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
