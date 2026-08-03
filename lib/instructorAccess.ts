import type { Prisma } from "@/app/generated/prisma/client";

/**
 * Cursos que um instrutor pode acompanhar no painel: onde é o titular, onde
 * responde por algum módulo, ou onde ministra ao menos uma aula.
 *
 * O vínculo por aula é o que mais aparece na prática. No curso de DICI havia 82
 * vínculos de aula e um único de módulo — sem considerar as aulas, seis
 * professores que somavam 34 aulas não enxergavam a própria turma.
 *
 * Use sempre esta função nas telas de leitura do painel do instrutor. Foi a
 * cópia manual desse filtro que deixou a página de inscritos fora de sincronia
 * com as demais, barrando os co-instrutores justamente na lista de alunos.
 *
 * Não vale para as ações de escrita (criar aula ao vivo, editar curso), que
 * seguem restritas ao titular de propósito.
 */
export function cursosDoInstrutor(instructorId: string): Prisma.CourseWhereInput {
  return {
    OR: [
      { instructorId },
      { modules: { some: { instructors: { some: { instructorId } } } } },
      { modules: { some: { lessons: { some: { instructors: { some: { instructorId } } } } } } },
    ],
  };
}
