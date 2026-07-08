import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || role !== "ADMIN") {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const leads = await prisma.liveLead.findMany({ orderBy: { createdAt: "asc" } });

  const rows = [
    ["Nome", "Especialidade", "Telefone", "E-mail", "Data"],
    ...leads.map((l) => [
      l.nome,
      l.especialidade,
      l.telefone,
      l.email,
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
      }).format(l.createdAt),
    ]),
  ];

  const csv = rows.map((r) => r.map((v) => `"${v.replace(/"/g, '""')}"`).join(",")).join("\r\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="live-leads-dici.csv"`,
    },
  });
}
