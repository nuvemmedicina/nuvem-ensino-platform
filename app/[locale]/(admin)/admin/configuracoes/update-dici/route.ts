import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user?.id || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const slug = "dici-neurogastroenterologia-2026";

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) {
    return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });
  }

  const includes = [
    "96 horas de carga horária total (agosto a novembro de 2026)",
    "Início das aulas: segunda-feira, 03 de agosto de 2026",
    "Primeiro encontro síncrono: quarta-feira, 05 de agosto de 2026, às 19h",
    "16 aulas gravadas distribuídas em 4 módulos de 20 horas cada",
    "Módulos Bônus — 'Como eu faço' — com 16 horas de conteúdo prático",
    "Encontros síncronos quinzenais para discussão de casos clínicos e esclarecimento de dúvidas",
    "Avaliações online ao término de cada módulo",
    "Certificado de Conclusão emitido pela FACOP — instituição credenciada pelo MEC",
    "Material complementar atualizado disponibilizado ao longo do curso",
    "Acesso à plataforma NU.V.E.M ENSINO durante todo o período do curso",
    "⚠ Direitos autorais: é proibida a reprodução total ou parcial das aulas por qualquer meio ou processo. A violação constitui crime (Código Penal, art. 184 e Lei nº 9.610/98), sujeitando-se à busca, apreensão e indenizações.",
  ].join("\n");

  await prisma.course.update({
    where: { slug },
    data: {
      startDateLabel: "Início: 03 de agosto de 2026 · Agosto a novembro de 2026",
      startDate: new Date("2026-08-03T00:00:00.000Z"),
      includes,
    },
  });

  return NextResponse.json({
    ok: true,
    message: "Curso DICI atualizado com data de início e primeiro encontro síncrono.",
  });
}
