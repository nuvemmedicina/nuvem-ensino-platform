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

export type GrupoResumo = {
  id: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  cards: number;
};

export type TopicoComFlashcards = {
  id: string;
  title: string;
  grupo: GrupoResumo | null;
};

export type ModuloComFlashcards = {
  id: string;
  title: string;
  /** Posição do módulo no curso — define a cor, via lib/moduleColors. */
  indice: number;
  topicos: TopicoComFlashcards[];
};

export type CursoComFlashcards = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  modulos: ModuloComFlashcards[];
  /** Grupos do curso que ainda não foram ligados a nenhum tópico. */
  soltos: GrupoResumo[];
};

const resumo = (g: {
  id: string; title: string; description: string | null; imageUrl: string | null;
  _count: { cards: number };
}): GrupoResumo => ({
  id: g.id, title: g.title, description: g.description, imageUrl: g.imageUrl, cards: g._count.cards,
});

/**
 * A estrutura de flashcards que este usuário enxerga, já organizada por curso
 * e módulo, na mesma ordem do currículo.
 *
 * Os tópicos aparecem mesmo sem grupo criado: a listagem mostra o desenho
 * inteiro do curso e deixa claro o que ainda está por vir, em vez de exibir
 * só o punhado de grupos que existe hoje.
 */
export async function estruturaParaUsuario(userId: string, role: string | undefined) {
  const cuidaDoConteudo = role === "ADMIN" || role === "EDITOR" || role === "INSTRUCTOR";

  const cursos = await prisma.course.findMany({
    where: cuidaDoConteudo
      ? { status: { not: "ARCHIVED" } }
      : { enrollments: { some: { userId, status: { in: ["ACTIVE", "COMPLETED"] } } } },
    orderBy: { title: "asc" },
    select: {
      id: true, title: true, thumbnailUrl: true,
      modules: {
        orderBy: { order: "asc" },
        select: {
          id: true, title: true,
          topics: {
            orderBy: { order: "asc" },
            select: {
              id: true, title: true,
              flashcardGroups: {
                where: { cards: { some: {} } },
                orderBy: { createdAt: "asc" },
                take: 1,
                select: { id: true, title: true, description: true, imageUrl: true, _count: { select: { cards: true } } },
              },
            },
          },
        },
      },
      flashcardGroups: {
        where: { topicId: null, cards: { some: {} } },
        orderBy: { createdAt: "desc" },
        select: { id: true, title: true, description: true, imageUrl: true, _count: { select: { cards: true } } },
      },
    },
  });

  const estrutura: CursoComFlashcards[] = cursos.map((c) => ({
    id: c.id,
    title: c.title,
    thumbnailUrl: c.thumbnailUrl,
    soltos: c.flashcardGroups.map(resumo),
    modulos: c.modules.map((m, i) => ({
      id: m.id,
      title: m.title,
      indice: i,
      topicos: m.topics.map((t) => ({
        id: t.id,
        title: t.title,
        grupo: t.flashcardGroups[0] ? resumo(t.flashcardGroups[0]) : null,
      })),
    })),
  }));

  // Material solto, sem curso nenhum: aberto a qualquer aluno logado.
  const gerais = await prisma.flashcardGroup.findMany({
    where: { courseId: null, cards: { some: {} } },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true, description: true, imageUrl: true, _count: { select: { cards: true } } },
  });

  return { cursos: estrutura, gerais: gerais.map(resumo) };
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
