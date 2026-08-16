import { prisma } from "@/lib/prisma";
import { AvaliacoesView, type Avaliacao, type PorCurso, type PorDocente, type Resumo } from "./AvaliacoesView";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ courseId?: string }>;
};

const MATRICULA_VALIDA = ["ACTIVE", "COMPLETED"] as const;

export default async function AvaliacoesPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { courseId } = await searchParams;
  const fmtDate = new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale === "es" ? "es-ES" : "pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  const [cursos, registros, matriculasPorCurso, notasDocentes] = await Promise.all([
    prisma.course.findMany({ select: { id: true, title: true }, orderBy: { title: "asc" } }),

    prisma.courseEvaluation.findMany({
      where: courseId ? { courseId } : {},
      select: {
        id: true, overallRating: true, contentRating: true, instructorRating: true,
        platformRating: true, wouldRecommend: true, highlight: true, suggestion: true, createdAt: true,
        course: { select: { id: true, title: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),

    prisma.enrollment.groupBy({
      by: ["courseId"],
      where: { status: { in: [...MATRICULA_VALIDA] }, ...(courseId ? { courseId } : {}) },
      _count: { _all: true },
    }),

    prisma.instructorEvaluation.findMany({
      where: courseId ? { courseId } : {},
      select: {
        id: true, rating: true, suggestion: true, createdAt: true,
        instructor: { select: { id: true, photoUrl: true, user: { select: { name: true } } } },
        course: { select: { title: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const matriculas = new Map(matriculasPorCurso.map((m) => [m.courseId, m._count._all]));
  const totalMatriculas = matriculasPorCurso.reduce((s, m) => s + m._count._all, 0);

  const media = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

  const resumo: Resumo = {
    total: registros.length,
    matriculas: totalMatriculas,
    recomendam: registros.filter((r) => r.wouldRecommend).length,
    medias: registros.length
      ? {
          overall: media(registros.map((r) => r.overallRating)),
          content: media(registros.map((r) => r.contentRating)),
          instructor: media(registros.map((r) => r.instructorRating)),
          platform: media(registros.map((r) => r.platformRating)),
        }
      : null,
  };

  // Só os cursos que já receberam resposta — a lista completa vira ruído.
  const agrupado = new Map<string, { titulo: string; notas: number[] }>();
  for (const r of registros) {
    const atual = agrupado.get(r.course.id) ?? { titulo: r.course.title, notas: [] };
    atual.notas.push(r.overallRating);
    agrupado.set(r.course.id, atual);
  }
  const porCurso: PorCurso[] = [...agrupado.entries()]
    .map(([id, v]) => ({
      id,
      titulo: v.titulo,
      total: v.notas.length,
      matriculas: matriculas.get(id) ?? 0,
      media: media(v.notas),
    }))
    .sort((a, b) => b.total - a.total);

  const avaliacoes: Avaliacao[] = registros.map((r) => ({
    id: r.id,
    aluno: r.user.name ?? "—",
    email: r.user.email ?? "—",
    curso: r.course.title,
    data: fmtDate.format(r.createdAt),
    overall: r.overallRating,
    content: r.contentRating,
    instructor: r.instructorRating,
    platform: r.platformRating,
    recomenda: r.wouldRecommend,
    highlight: r.highlight,
    suggestion: r.suggestion,
  }));

  // Docentes: média por pessoa, com as sugestões escritas (a coordenação vê quem
  // escreveu; no painel do instrutor a mesma resposta vai sem identificação).
  const porDocenteMapa = new Map<string, PorDocente>();
  for (const n of notasDocentes) {
    const atual = porDocenteMapa.get(n.instructor.id) ?? {
      id: n.instructor.id,
      nome: n.instructor.user.name ?? "—",
      fotoUrl: n.instructor.photoUrl,
      total: 0,
      media: 0,
      sugestoes: [],
    };
    atual.total += 1;
    atual.media += n.rating;
    if (n.suggestion) {
      atual.sugestoes.push({
        id: n.id,
        texto: n.suggestion,
        aluno: n.user.name ?? "—",
        curso: n.course.title,
        data: fmtDate.format(n.createdAt),
      });
    }
    porDocenteMapa.set(n.instructor.id, atual);
  }
  const porDocente: PorDocente[] = [...porDocenteMapa.values()]
    .map((d) => ({ ...d, media: d.media / d.total }))
    .sort((a, b) => b.total - a.total || b.media - a.media);

  return (
    <AvaliacoesView
      cursos={cursos}
      courseId={courseId}
      resumo={resumo}
      porCurso={porCurso}
      porDocente={porDocente}
      avaliacoes={avaliacoes}
    />
  );
}
