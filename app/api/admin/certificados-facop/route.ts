import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { carregarSituacaoFacop } from "@/lib/certificadosFacop";

/**
 * Dados dos alunos que já responderam ao pedido, nas colunas do formulário
 * financeiro da FACOP. Separado por ";" e com BOM para o Excel em português
 * abrir com acentos e colunas certas.
 */
export async function GET(req: Request) {
  const session = await auth();
  if ((session?.user as { role?: string } | undefined)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const slug = new URL(req.url).searchParams.get("curso") ?? "";
  const curso = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, hours: true, showCertificationSeals: true },
  });
  if (!curso?.showCertificationSeals) return NextResponse.json({ error: "Curso não encontrado." }, { status: 404 });

  const { alunos } = await carregarSituacaoFacop(curso.id);
  const respondidos = alunos.filter((a) => a.respondidoEm).sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  const cabecalho = ["Ref", "Curso", "Carga horária", "Nome completo", "RG", "CPF", "Naturalidade", "Contato", "E-mail", "Endereço completo", "Dados recebidos em"];
  const linhas = respondidos.map((a, i) => [
    String(i + 1),
    curso.title,
    `${curso.hours} Horas`,
    a.facop.nome,
    a.facop.rg,
    a.facop.cpf,
    a.facop.naturalidade,
    a.facop.contato,
    a.facop.email,
    a.facop.endereco,
    new Date(a.respondidoEm!).toLocaleDateString("pt-BR"),
  ]);
  const celula = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const csv = "﻿" + [cabecalho, ...linhas].map((l) => l.map(celula).join(";")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="facop-${curso.slug}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
